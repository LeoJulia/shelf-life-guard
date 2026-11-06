-- Run as postgres in a disposable/local DB AFTER storage-lifecycle.sql,
-- atomic-domain-operations.sql and account-delete-cascade.sql:
-- psql "$LOCAL_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/storage-lifecycle.test.sql
-- No Storage objects are inserted, removed or uploaded. Every path belongs to
-- a newly generated synthetic auth user. All fixtures/helpers roll back.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create temporary table sl_ids (
  name text primary key,
  id uuid not null unique default gen_random_uuid()
) on commit drop;
insert into sl_ids (name) values
  ('a'), ('b'), ('product'), ('shared_product'), ('foreign_product'),
  ('tag'), ('routine'), ('copy'), ('copy_again'), ('item'),
  ('photo_one'), ('photo_two'), ('account_photo'),
  ('foreign_routine'), ('foreign_photo');
grant select on pg_temp.sl_ids to authenticated, service_role;

create function pg_temp.sl_id(p_name text) returns uuid
language sql stable security invoker set search_path = '' as $$
  select id from pg_temp.sl_ids where name = p_name;
$$;
create function pg_temp.sl_path(p_name text, p_owner text default 'a') returns text
language sql stable security invoker set search_path = '' as $$
  select pg_temp.sl_id(p_owner)::text || '/storage-lifecycle-test/' || p_name || '.webp';
$$;
create function pg_temp.sl_assert(p_ok boolean, p_message text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_ok is not true then raise exception 'ASSERTION FAILED: %', p_message; end if;
end;
$$;
create function pg_temp.sl_expect_error(p_sql text, p_state text) returns void
language plpgsql security invoker set search_path = '' as $$
declare failed boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state then
      raise exception 'Expected SQLSTATE %, got % (%): %', p_state, sqlstate, sqlerrm, p_sql;
    end if;
    failed := true;
  end;
  if not failed then raise exception 'Expected SQLSTATE %, statement succeeded: %', p_state, p_sql; end if;
end;
$$;
create function pg_temp.sl_state(p_bucket text, p_path text, p_state text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_temp.sl_assert(exists (
    select 1 from private.image_lifecycle where bucket = p_bucket and path = p_path and state = p_state
  ), p_path || ' should be ' || p_state);
end;
$$;

-- The production claimer is intentionally global. Put the selected fixture
-- first, and fail closed if a regression would mutate any non-fixture queue row.
-- This guard itself is transactional, and does not grant clients queue access.
create function pg_temp.sl_guard_queue() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op <> 'INSERT' and old.user_id not in (pg_temp.sl_id('a'), pg_temp.sl_id('b')) then
    raise exception 'Test must not mutate a non-fixture cleanup job';
  end if;
  if tg_op <> 'DELETE' and new.user_id not in (pg_temp.sl_id('a'), pg_temp.sl_id('b')) then
    raise exception 'Test must not create a non-fixture cleanup job';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger storage_lifecycle_test_synthetic_only
  before insert or update or delete on private.image_lifecycle
  for each row execute function pg_temp.sl_guard_queue();

create function pg_temp.sl_claim(p_bucket text, p_path text) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare claimed record; token uuid; n integer := 0;
begin
  update private.image_lifecycle set ready_at = '-infinity'
  where bucket = p_bucket and path = p_path and user_id in (pg_temp.sl_id('a'), pg_temp.sl_id('b'));
  perform pg_temp.sl_assert(found, 'claim fixture exists');
  for claimed in select * from public.claim_image_cleanup(1) loop
    n := n + 1;
    perform pg_temp.sl_assert(claimed.bucket = p_bucket and claimed.path = p_path, 'only requested fixture claimed');
    token := claimed.claim_token;
  end loop;
  perform pg_temp.sl_assert(n = 1 and token is not null, 'exactly one token returned');
  return token;
end;
$$;

-- Evaluate the actual restrictive policy expressions without fabricating
-- storage.objects rows or depending on bucket ownership/Storage internals.
create function pg_temp.sl_storage_policy(p_bucket text, p_path text, p_expected boolean) returns void
language plpgsql security invoker set search_path = '' as $$
declare policy record; expression text; allowed boolean; n integer := 0;
begin
  for policy in
    select polname, polpermissive, polroles,
      pg_catalog.pg_get_expr(polqual, polrelid) as using_expression,
      pg_catalog.pg_get_expr(polwithcheck, polrelid) as check_expression
    from pg_catalog.pg_policy where polrelid = 'storage.objects'::regclass
      and polname in ('storage_active_account_insert', 'storage_active_account_update')
  loop
    n := n + 1;
    perform pg_temp.sl_assert(not policy.polpermissive, policy.polname || ' is restrictive');
    perform pg_temp.sl_assert('authenticated'::regrole::oid = any(policy.polroles), policy.polname || ' covers authenticated');
    perform pg_temp.sl_assert(policy.check_expression is not null, policy.polname || ' has WITH CHECK');
    if policy.polname = 'storage_active_account_update' then
      perform pg_temp.sl_assert(policy.using_expression is not null, 'Storage UPDATE has USING');
    end if;
    foreach expression in array array[policy.using_expression, policy.check_expression] loop
      if expression is null then continue; end if;
      execute format('select (%s) from (select %L::text as bucket_id, %L::text as name) objects',
        expression, p_bucket, p_path) into allowed;
      perform pg_temp.sl_assert(allowed is not distinct from p_expected, policy.polname || ': ' || p_path);
    end loop;
  end loop;
  perform pg_temp.sl_assert(n = 2, 'both Storage policies exist');
end;
$$;

-- No ON CONFLICT: an extremely unlikely generated-ID collision must fail,
-- never reuse/update a real auth user or a previous fixture.
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
select id, 'authenticated', 'authenticated', 'storage-lifecycle-' || id::text || '@example.invalid', '{}', '{}'
from pg_temp.sl_ids where name in ('a', 'b');
select pg_temp.sl_assert(not exists (
  select 1 from storage.objects where starts_with(name, pg_temp.sl_id('a')::text || '/')
    or starts_with(name, pg_temp.sl_id('b')::text || '/')
), 'synthetic users must not own any real Storage objects');

set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sl_id('b')::text, true);
select set_config('request.jwt.claims', jsonb_build_object('sub', pg_temp.sl_id('b'), 'role', 'authenticated')::text, true);
select public.reserve_image_upload('product-images', pg_temp.sl_path('foreign-reserved', 'b'));
insert into public.products (id, user_id, brand, name, year, image_path)
values (pg_temp.sl_id('foreign_product'), auth.uid(), 'Fixture B', 'Foreign product', 2026, pg_temp.sl_path('foreign-product', 'b'));
insert into public.routines (id, user_id, name, start_date)
values (pg_temp.sl_id('foreign_routine'), auth.uid(), 'Foreign routine', date '2026-01-01');
insert into public.routine_photos (id, routine_id, user_id, series, slot, image_path)
values (pg_temp.sl_id('foreign_photo'), pg_temp.sl_id('foreign_routine'), auth.uid(), 'start', 'front', pg_temp.sl_path('foreign-photo', 'b'));

select set_config('request.jwt.claim.sub', pg_temp.sl_id('a')::text, true);
select set_config('request.jwt.claims', jsonb_build_object('sub', pg_temp.sl_id('a'), 'role', 'authenticated')::text, true);
insert into public.products (id, user_id, brand, name, year)
values (pg_temp.sl_id('product'), auth.uid(), 'Fixture A', 'Product', 2026),
       (pg_temp.sl_id('shared_product'), auth.uid(), 'Fixture A', 'Shared product', 2026);
insert into public.tags (id, user_id, name, color)
values (pg_temp.sl_id('tag'), auth.uid(), 'Lifecycle fixture', '#123456');
insert into public.product_tags (product_id, tag_id) values (pg_temp.sl_id('product'), pg_temp.sl_id('tag'));
insert into public.routines (id, user_id, name, start_date)
values (pg_temp.sl_id('routine'), auth.uid(), 'Source', date '2026-01-01');
insert into public.routines (id, user_id, name, start_date, copied_from)
values (pg_temp.sl_id('copy'), auth.uid(), 'Copy', date '2026-01-01', pg_temp.sl_id('routine'));
insert into public.routines (id, user_id, name, start_date, copied_from)
values (pg_temp.sl_id('copy_again'), auth.uid(), 'Copy again', date '2026-01-01', pg_temp.sl_id('copy'));
insert into public.routine_items (id, routine_id, product_id, user_id)
values (pg_temp.sl_id('item'), pg_temp.sl_id('copy'), pg_temp.sl_id('product'), auth.uid());

-- User-facing calls really run as authenticated, including denial assertions.
do $test$
declare schema_name text; statement text; bucket text;
begin
  perform pg_temp.sl_assert(auth.uid() = pg_temp.sl_id('a'), 'JWT owner A');
  perform pg_temp.sl_assert(not exists(select 1 from public.products where id = pg_temp.sl_id('foreign_product')), 'foreign product is hidden by RLS');
  perform pg_temp.sl_expect_error(format('select public.reserve_image_upload(%L,%L)', 'product-images', pg_temp.sl_path('forbidden', 'b')), '42501');
  perform public.settle_image_upload('product-images', pg_temp.sl_path('foreign-reserved', 'b'));
  perform public.release_image_upload('product-images', pg_temp.sl_path('foreign-reserved', 'b'));
  perform pg_temp.sl_expect_error(format('update public.products set image_path=%L where id=%L',
    pg_temp.sl_path('foreign-product', 'b'), pg_temp.sl_id('product')), '42501');

  foreach statement in array array[
    'select * from private.image_lifecycle',
    format('insert into private.image_lifecycle(bucket,path,user_id,state) values (%L,%L,%L,%L)', 'product-images', pg_temp.sl_path('forged'), auth.uid(), 'pending'),
    format('update private.image_lifecycle set state=%L where user_id=%L', 'deleted', auth.uid()),
    format('delete from private.image_lifecycle where user_id=%L', auth.uid()),
    'select * from private.account_deletions',
    format('insert into private.account_deletions(user_id) values (%L)', auth.uid()),
    format('update private.account_deletions set completed_at=now() where user_id=%L', auth.uid()),
    format('delete from private.account_deletions where user_id=%L', auth.uid())
  ] loop
    perform pg_temp.sl_expect_error(statement, '42501');
  end loop;
  foreach schema_name in array array['public', 'private'] loop
    perform pg_temp.sl_expect_error(format('select * from %I.claim_image_cleanup(1)', schema_name), '42501');
    perform pg_temp.sl_expect_error(format('select %I.finish_image_cleanup(%L,%L,%L::uuid)', schema_name,
      'product-images', pg_temp.sl_path('main'), gen_random_uuid()), '42501');
    perform pg_temp.sl_expect_error(format('select * from %I.pending_account_deletions(%L)', schema_name, auth.uid()), '42501');
    perform pg_temp.sl_expect_error(format('select %I.prepare_account_cleanup(%L)', schema_name, auth.uid()), '42501');
    perform pg_temp.sl_expect_error(format('select %I.finish_account_cleanup(%L)', schema_name, auth.uid()), '42501');
  end loop;
  foreach bucket in array array['product-images', 'routine-photos'] loop
    perform pg_temp.sl_storage_policy(bucket, pg_temp.sl_path('active'), true);
    perform pg_temp.sl_storage_policy(bucket, pg_temp.sl_path('foreign', 'b'), false);
  end loop;
end;
$test$;

select public.reserve_image_upload('product-images', pg_temp.sl_path('main'));
select public.release_image_upload('product-images', pg_temp.sl_path('main'));
reset role;
select pg_temp.sl_assert(exists (
  select 1 from private.image_lifecycle where path = pg_temp.sl_path('main') and state = 'uploading'
    and not upload_settled and ready_at > now() and attempts = 0
), 'reserve persists an unsettled lease; premature release is a no-op');
select pg_temp.sl_assert(exists (
  select 1 from private.image_lifecycle where path = pg_temp.sl_path('foreign-reserved', 'b')
    and state = 'uploading' and not upload_settled and user_id = pg_temp.sl_id('b')
), 'foreign settle/release did not mutate another owner');

set local role authenticated;
select public.settle_image_upload('product-images', pg_temp.sl_path('main'));
reset role;
select pg_temp.sl_assert(exists (
  select 1 from private.image_lifecycle where path = pg_temp.sl_path('main') and state = 'uploading' and upload_settled
), 'settle succeeds without attaching');
set local role authenticated;
update public.products set image_path = pg_temp.sl_path('main') where id = pg_temp.sl_id('product');
-- The attachment statement has succeeded. A later compensation/release must
-- not undo it (the outer test transaction still deliberately never commits).
select public.release_image_upload('product-images', pg_temp.sl_path('main'));
reset role;
select pg_temp.sl_state('product-images', pg_temp.sl_path('main'), 'attached');
select pg_temp.sl_assert((select image_path = pg_temp.sl_path('main') from public.products where id = pg_temp.sl_id('product')), 'attach changed the product');

set local role authenticated;
select public.reserve_image_upload('product-images', pg_temp.sl_path('replacement'));
select public.settle_image_upload('product-images', pg_temp.sl_path('replacement'));
update public.products set image_path = pg_temp.sl_path('replacement') where id = pg_temp.sl_id('product');
reset role;
select pg_temp.sl_state('product-images', pg_temp.sl_path('main'), 'pending');
select pg_temp.sl_state('product-images', pg_temp.sl_path('replacement'), 'attached');

-- Expired worker claims get a new fencing token. A stale success OR failure
-- acknowledgement cannot finish somebody else's lease; removal errors retry.
do $test$
declare first_token uuid; second_token uuid; third_token uuid; before_ack jsonb;
begin
  first_token := pg_temp.sl_claim('product-images', pg_temp.sl_path('main'));
  perform pg_temp.sl_assert(exists (
    select 1 from private.image_lifecycle where path = pg_temp.sl_path('main')
      and state = 'deleting' and ready_at > now() and attempts = 1
  ), 'claim starts a timed lease');
  second_token := pg_temp.sl_claim('product-images', pg_temp.sl_path('main'));
  perform pg_temp.sl_assert(second_token <> first_token, 'expired claim gets a different token');
  select to_jsonb(q) into before_ack from private.image_lifecycle q where path = pg_temp.sl_path('main');
  perform public.finish_image_cleanup('product-images', pg_temp.sl_path('main'), first_token);
  perform public.finish_image_cleanup('product-images', pg_temp.sl_path('main'), first_token, 'stale failure');
  perform pg_temp.sl_assert((select to_jsonb(q) = before_ack from private.image_lifecycle q where path = pg_temp.sl_path('main')), 'stale acknowledgements are exact no-ops');
  perform public.finish_image_cleanup('product-images', pg_temp.sl_path('main'), second_token, 'Storage removal failed');
  perform pg_temp.sl_assert(exists (
    select 1 from private.image_lifecycle where path = pg_temp.sl_path('main') and state = 'pending'
      and claim_token is null and attempts = 2 and last_error = 'Storage removal failed' and ready_at > now()
  ), 'failed removal retains the job with backoff');
  third_token := pg_temp.sl_claim('product-images', pg_temp.sl_path('main'));
  perform public.finish_image_cleanup('product-images', pg_temp.sl_path('main'), third_token);
  perform pg_temp.sl_state('product-images', pg_temp.sl_path('main'), 'deleted');
  perform pg_temp.sl_assert(exists (
    select 1 from private.image_lifecycle where path = pg_temp.sl_path('main') and attempts = 3
      and claim_token is null and last_error is null
  ), 'successful retry clears token/error, retaining the tombstone');
end;
$test$;
set local role authenticated;
select pg_temp.sl_expect_error(format('update public.products set image_path=%L where id=%L', pg_temp.sl_path('main'), pg_temp.sl_id('product')), '55000');
select pg_temp.sl_assert((select image_path = pg_temp.sl_path('replacement') from public.products where id = pg_temp.sl_id('product')), 'deleted path cannot reattach; failed UPDATE rolled back');

-- Sharing is reference-counted by actual rows, not by compensation calls.
update public.products set image_path = pg_temp.sl_path('replacement') where id = pg_temp.sl_id('shared_product');
select public.release_image_upload('product-images', pg_temp.sl_path('replacement'));
delete from public.products where id = pg_temp.sl_id('shared_product');
reset role;
select pg_temp.sl_state('product-images', pg_temp.sl_path('replacement'), 'attached');
set local role authenticated;
update public.products set image_path = null where id = pg_temp.sl_id('product');
reset role;
select pg_temp.sl_state('product-images', pg_temp.sl_path('replacement'), 'pending');
select public.finish_image_cleanup('product-images', pg_temp.sl_path('replacement'), pg_temp.sl_claim('product-images', pg_temp.sl_path('replacement')));
select pg_temp.sl_state('product-images', pg_temp.sl_path('replacement'), 'deleted');

set local role authenticated;
select public.reserve_image_upload('routine-photos', pg_temp.sl_path('shared-photo'));
select public.settle_image_upload('routine-photos', pg_temp.sl_path('shared-photo'));
insert into public.routine_photos (id, routine_id, user_id, series, slot, image_path)
values (pg_temp.sl_id('photo_one'), pg_temp.sl_id('copy'), auth.uid(), 'start', 'front', pg_temp.sl_path('shared-photo')),
       (pg_temp.sl_id('photo_two'), pg_temp.sl_id('copy'), auth.uid(), 'start', 'right', pg_temp.sl_path('shared-photo'));
delete from public.routine_photos where id = pg_temp.sl_id('photo_one');
reset role;
select pg_temp.sl_state('routine-photos', pg_temp.sl_path('shared-photo'), 'attached');
set local role authenticated;
select public.reserve_image_upload('routine-photos', pg_temp.sl_path('photo-replacement'));
select public.settle_image_upload('routine-photos', pg_temp.sl_path('photo-replacement'));
update public.routine_photos set image_path = pg_temp.sl_path('photo-replacement') where id = pg_temp.sl_id('photo_two');
reset role;
select pg_temp.sl_state('routine-photos', pg_temp.sl_path('shared-photo'), 'pending');
select pg_temp.sl_state('routine-photos', pg_temp.sl_path('photo-replacement'), 'attached');
set local role authenticated;
delete from public.routine_photos where id = pg_temp.sl_id('photo_two');
reset role;
select pg_temp.sl_state('routine-photos', pg_temp.sl_path('photo-replacement'), 'pending');

-- A never-attached, settled upload can be released; an ambiguous in-flight
-- upload stays retryable even after a successful removal of a missing object.
set local role authenticated;
select public.reserve_image_upload('product-images', pg_temp.sl_path('released'));
select public.settle_image_upload('product-images', pg_temp.sl_path('released'));
select public.release_image_upload('product-images', pg_temp.sl_path('released'));
select public.reserve_image_upload('product-images', pg_temp.sl_path('in-flight'));
reset role;
select pg_temp.sl_state('product-images', pg_temp.sl_path('released'), 'pending');
select public.finish_image_cleanup('product-images', pg_temp.sl_path('in-flight'), pg_temp.sl_claim('product-images', pg_temp.sl_path('in-flight')));
select pg_temp.sl_assert(exists (
  select 1 from private.image_lifecycle where path = pg_temp.sl_path('in-flight') and state = 'pending'
    and not upload_settled and ready_at >= now() + interval '1 hour'
), 'unsettled upload survives cleanup for a late upload retry');

-- Account intent detaches existing references BEFORE it blocks further writes.
set local role authenticated;
select public.reserve_image_upload('product-images', pg_temp.sl_path('account-product'));
select public.settle_image_upload('product-images', pg_temp.sl_path('account-product'));
update public.products set image_path = pg_temp.sl_path('account-product') where id = pg_temp.sl_id('product');
select public.reserve_image_upload('routine-photos', pg_temp.sl_path('account-photo'));
select public.settle_image_upload('routine-photos', pg_temp.sl_path('account-photo'));
insert into public.routine_photos (id, routine_id, user_id, series, slot, image_path)
values (pg_temp.sl_id('account_photo'), pg_temp.sl_id('copy'), auth.uid(), 'end', 'front', pg_temp.sl_path('account-photo'));
select public.request_account_deletion();
select public.request_account_deletion();
select pg_temp.sl_assert((select image_path is null from public.products where id = pg_temp.sl_id('product')), 'intent detaches product image');
select pg_temp.sl_assert(not exists(select 1 from public.routine_photos where user_id = auth.uid()), 'intent removes own photo references');

do $test$
declare statement text; bucket text;
begin
  perform pg_temp.sl_expect_error(format('select public.reserve_image_upload(%L,%L)', 'product-images', pg_temp.sl_path('blocked')), '55000');
  foreach statement in array array[
    format('insert into public.products(user_id,brand,name,year) values (%L,%L,%L,2026)', auth.uid(), 'Blocked', 'Blocked'),
    format('update public.products set name=%L where id=%L', 'Blocked', pg_temp.sl_id('product')),
    format('insert into public.tags(user_id,name,color) values (%L,%L,%L)', auth.uid(), 'Blocked', '#ffffff'),
    format('update public.tags set name=%L where id=%L', 'Blocked', pg_temp.sl_id('tag')),
    format('insert into public.product_tags(product_id,tag_id) values (%L,%L)', pg_temp.sl_id('product'), pg_temp.sl_id('tag')),
    format('update public.product_tags set tag_id=%L where product_id=%L', pg_temp.sl_id('tag'), pg_temp.sl_id('product')),
    format('insert into public.routines(user_id,start_date) values (%L,current_date)', auth.uid()),
    format('update public.routines set name=%L where id=%L', 'Blocked', pg_temp.sl_id('copy')),
    format('insert into public.routine_items(user_id,routine_id,product_id) values (%L,%L,%L)', auth.uid(), pg_temp.sl_id('copy_again'), pg_temp.sl_id('product')),
    format('update public.routine_items set position=99 where id=%L', pg_temp.sl_id('item')),
    format('insert into public.routine_photos(user_id,routine_id,series,slot,image_path) values (%L,%L,%L,%L,%L)',
      auth.uid(), pg_temp.sl_id('copy'), 'end', 'front', pg_temp.sl_path('blocked-photo'))
  ] loop
    perform pg_temp.sl_expect_error(statement, '55000');
  end loop;
  foreach bucket in array array['product-images', 'routine-photos'] loop
    perform pg_temp.sl_assert(not private.storage_account_active(pg_temp.sl_path('blocked')), 'intent disables Storage account predicate');
    perform pg_temp.sl_storage_policy(bucket, pg_temp.sl_path('blocked'), false);
  end loop;
  perform pg_temp.sl_storage_policy('unrelated-bucket', pg_temp.sl_path('unrelated'), true);
end;
$test$;
reset role;
select pg_temp.sl_assert((select count(*) = 1 from private.account_deletions where user_id = pg_temp.sl_id('a')), 'account intent is idempotent');
select pg_temp.sl_state('product-images', pg_temp.sl_path('account-product'), 'pending');
select pg_temp.sl_state('routine-photos', pg_temp.sl_path('account-photo'), 'pending');
select pg_temp.sl_assert(not private.prepare_account_cleanup(pg_temp.sl_id('a')), 'recent unsettled upload prevents auth deletion even without Storage objects');
-- Expire only this fixture's ambiguity window; do not wait for wall-clock time.
update private.image_lifecycle set created_at = now() - interval '2 hours' where path = pg_temp.sl_path('in-flight');
select pg_temp.sl_assert(private.prepare_account_cleanup(pg_temp.sl_id('a')), 'no Storage objects or recent in-flight uploads remain');
select pg_temp.sl_assert(not private.prepare_account_cleanup(pg_temp.sl_id('b')), 'no deletion intent is not permission to delete auth');

-- The service RPCs are not merely SECURITY DEFINER endpoints left open to
-- PUBLIC. Check both wrappers/helpers, including anon and authenticated grants.
do $test$
declare schema_name text; signature text; proc regprocedure; relation regclass;
begin
  foreach schema_name in array array['public', 'private'] loop
    foreach signature in array array[
      'claim_image_cleanup(integer)', 'finish_image_cleanup(text,text,uuid,text)',
      'pending_account_deletions(uuid)', 'prepare_account_cleanup(uuid)', 'finish_account_cleanup(uuid,text)'
    ] loop
      proc := (schema_name || '.' || signature)::regprocedure;
      perform pg_temp.sl_assert(not has_function_privilege('authenticated', proc, 'EXECUTE'), 'authenticated denied: ' || proc::text);
      perform pg_temp.sl_assert(not has_function_privilege('anon', proc, 'EXECUTE'), 'anon denied: ' || proc::text);
      perform pg_temp.sl_assert(has_function_privilege('service_role', proc, 'EXECUTE'), 'service granted: ' || proc::text);
    end loop;
  end loop;
  foreach relation in array array['private.image_lifecycle'::regclass, 'private.account_deletions'::regclass] loop
    perform pg_temp.sl_assert((select relrowsecurity from pg_catalog.pg_class where oid = relation), 'queue has RLS: ' || relation::text);
  end loop;
end;
$test$;

-- Admin account deletion carries no end-user JWT. Exercise ON DELETE SET NULL
-- while the copy is still present, then auth cascades with another copied_from
-- link, items, tags and product_tags still present.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
delete from public.routines where id = pg_temp.sl_id('routine');
select pg_temp.sl_assert((select copied_from is null from public.routines where id = pg_temp.sl_id('copy')), 'copied_from FK can clear while account writes are blocked');
select pg_temp.sl_assert((select copied_from = pg_temp.sl_id('copy') from public.routines where id = pg_temp.sl_id('copy_again')), 'second copied_from link remains for auth cascade');
delete from auth.users where id = pg_temp.sl_id('a');

do $test$
declare relation text; remaining bigint;
begin
  perform pg_temp.sl_assert(not exists(select 1 from auth.users where id = pg_temp.sl_id('a')), 'auth user A deleted');
  foreach relation in array array['products', 'tags', 'routines', 'routine_items', 'routine_photos'] loop
    execute format('select count(*) from public.%I where user_id=%L', relation, pg_temp.sl_id('a')) into remaining;
    perform pg_temp.sl_assert(remaining = 0, 'account cascade removed ' || relation);
  end loop;
  perform pg_temp.sl_assert(not exists(select 1 from public.product_tags where product_id = pg_temp.sl_id('product') or tag_id = pg_temp.sl_id('tag')), 'account cascade removed product_tags');
  perform pg_temp.sl_assert(exists(select 1 from private.account_deletions where user_id = pg_temp.sl_id('a') and completed_at is null), 'account retry intent survives auth deletion');
  perform pg_temp.sl_state('product-images', pg_temp.sl_path('account-product'), 'pending');
  perform pg_temp.sl_state('routine-photos', pg_temp.sl_path('account-photo'), 'pending');
  perform pg_temp.sl_state('product-images', pg_temp.sl_path('main'), 'deleted');
  perform pg_temp.sl_assert(exists(select 1 from public.products where id = pg_temp.sl_id('foreign_product') and image_path = pg_temp.sl_path('foreign-product', 'b')), 'other account product untouched');
  perform pg_temp.sl_assert(exists(select 1 from public.routine_photos where id = pg_temp.sl_id('foreign_photo')), 'other account photo untouched');
end;
$test$;

-- Service can finish durable queue records after the auth row is already gone.
set local role service_role;
select pg_temp.sl_assert(exists(select 1 from public.pending_account_deletions(pg_temp.sl_id('a'))), 'deleted auth account is still retryable');
select public.finish_account_cleanup(pg_temp.sl_id('a'), 'Injected retry');
reset role;
select pg_temp.sl_assert(exists(select 1 from private.account_deletions where user_id = pg_temp.sl_id('a') and completed_at is null and last_error = 'Injected retry'), 'failed account finish stays pending');
set local role service_role;
select public.finish_account_cleanup(pg_temp.sl_id('a'));
reset role;
select pg_temp.sl_assert(exists(select 1 from private.account_deletions where user_id = pg_temp.sl_id('a') and completed_at is not null and last_error is null), 'successful account finish records completion');
select pg_temp.sl_assert(not exists(select 1 from private.pending_account_deletions(pg_temp.sl_id('a'))), 'completed account is no longer polled');

-- Also exercise auth cascades with live photo references (no prior intent).
-- These must enqueue cleanup rather than disappear with the deleted auth user.
delete from auth.users where id = pg_temp.sl_id('b');
select pg_temp.sl_assert(not exists(select 1 from public.products where id = pg_temp.sl_id('foreign_product')), 'direct auth cascade removed product');
select pg_temp.sl_assert(not exists(select 1 from public.routines where id = pg_temp.sl_id('foreign_routine')), 'direct auth cascade removed routine');
select pg_temp.sl_assert(not exists(select 1 from public.routine_photos where id = pg_temp.sl_id('foreign_photo')), 'direct auth cascade removed photo');
select pg_temp.sl_state('product-images', pg_temp.sl_path('foreign-product', 'b'), 'pending');
select pg_temp.sl_state('routine-photos', pg_temp.sl_path('foreign-photo', 'b'), 'pending');

-- Old JWTs cannot restore Storage write permission after auth deletion, even
-- for the user without an account_deletions tombstone.
set local role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.sl_id('b')::text, true);
select set_config('request.jwt.claims', jsonb_build_object('sub', pg_temp.sl_id('b'), 'role', 'authenticated')::text, true);
select pg_temp.sl_storage_policy('product-images', pg_temp.sl_path('stale-jwt', 'b'), false);
select pg_temp.sl_storage_policy('routine-photos', pg_temp.sl_path('stale-jwt', 'b'), false);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select pg_temp.sl_assert(not private.storage_account_active(pg_temp.sl_path('anonymous')), 'missing JWT is not active');
select pg_temp.sl_expect_error(format('select public.reserve_image_upload(%L,%L)', 'product-images', pg_temp.sl_path('anonymous')), '42501');
reset role;

rollback;
