-- Run AFTER atomic-domain-operations.sql, as postgres in a disposable/local DB:
-- psql "$LOCAL_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/atomic-domain-operations.test.sql
-- Synthetic accounts only. Everything (including failure-injection triggers)
-- is rolled back. No Storage objects or nonnull image paths are created, so
-- these tests also work with the separate Storage lifecycle triggers installed.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create function pg_temp.atomic_assert(p_ok boolean, p_message text)
returns void language plpgsql security invoker set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Test assertion needs a subject';
  end if;
  if p_ok is not true then raise exception 'ASSERTION FAILED: %', p_message; end if;
end;
$function$;

create function pg_temp.atomic_expect_error(p_sql text, p_state text)
returns void language plpgsql security invoker set search_path = ''
as $function$
declare
  v_failed boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state then
      raise exception 'Expected SQLSTATE %, got % (%): %', p_state, sqlstate, sqlerrm, p_sql;
    end if;
    v_failed := true;
  end;
  if not v_failed then raise exception 'Expected SQLSTATE %, statement succeeded: %', p_state, p_sql; end if;
end;
$function$;

-- Statement-level exceptions occur AFTER the rows were changed, proving that
-- the entire RPC (not just the failing INSERT/UPDATE) rolls back.
create function pg_temp.atomic_inject_failure()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  if auth.uid() is null then raise exception 'Test injection needs a subject'; end if;
  if (tg_table_name = 'product_tags' and pg_catalog.current_setting('atomic_domain_test.fail', true) = 'product_link')
     or (tg_table_name = 'routine_items' and tg_op = 'INSERT'
         and pg_catalog.current_setting('atomic_domain_test.fail', true) = 'duplicate')
     or (tg_table_name = 'routine_items' and tg_op = 'UPDATE'
         and pg_catalog.current_setting('atomic_domain_test.fail', true) = 'reorder') then
    raise exception 'Injected atomic operation failure' using errcode = 'PZ001';
  end if;
  return null;
end;
$function$;

revoke execute on function pg_temp.atomic_assert(boolean, text) from public, anon;
revoke execute on function pg_temp.atomic_expect_error(text, text) from public, anon;
revoke execute on function pg_temp.atomic_inject_failure() from public, anon;
grant execute on function pg_temp.atomic_assert(boolean, text) to authenticated, service_role;
grant execute on function pg_temp.atomic_expect_error(text, text) to authenticated, service_role;
grant execute on function pg_temp.atomic_inject_failure() to authenticated, service_role;

create trigger atomic_test_product_link_failure after insert on public.product_tags
  for each statement execute function pg_temp.atomic_inject_failure();
create trigger atomic_test_items_failure after insert or update on public.routine_items
  for each statement execute function pg_temp.atomic_inject_failure();

-- Intentionally no ON CONFLICT: an unexpected fixture collision fails loudly.
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'atomic-owner-a@example.invalid', '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'atomic-owner-b@example.invalid', '{}'::jsonb, '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

insert into public.products (id, user_id, brand, name, year)
values ('20000000-0000-4000-8000-000000000003', auth.uid(), 'Fixture B', 'Other owner', 2025);
insert into public.tags (id, user_id, name, color)
values ('30000000-0000-4000-8000-000000000002', auth.uid(), 'Shared name', '#222222');
insert into public.routines (id, user_id, name, start_date)
values ('40000000-0000-4000-8000-000000000003', auth.uid(), 'Other owner', date '2026-01-01');
insert into public.routine_items (id, routine_id, product_id, user_id)
values ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003',
        '20000000-0000-4000-8000-000000000003', auth.uid());
insert into public.product_tags (product_id, tag_id)
values ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

insert into public.products (id, user_id, brand, name, year)
values
  ('20000000-0000-4000-8000-000000000001', auth.uid(), 'Fixture A', 'First', 2024),
  ('20000000-0000-4000-8000-000000000002', auth.uid(), 'Fixture A', 'Second', 2024);
insert into public.tags (id, user_id, name, color)
values ('30000000-0000-4000-8000-000000000001', auth.uid(), 'Shared name', '#111111');
insert into public.routines (id, user_id, name, start_date, end_date, notes)
values
  ('40000000-0000-4000-8000-000000000001', auth.uid(), 'Source', date '2026-01-01', date '2026-02-01', 'Do not copy'),
  ('40000000-0000-4000-8000-000000000002', auth.uid(), 'Empty', date '2026-01-01', null, null),
  ('40000000-0000-4000-8000-000000000004', auth.uid(), 'Another own routine', date '2026-01-01', null, null);
insert into public.routine_items (id, routine_id, product_id, user_id, position)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', auth.uid(), 0),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', auth.uid(), 1),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', auth.uid(), 0);
update public.routine_items set time_of_day = 'evening', is_constant = false, sun = false
where id = '50000000-0000-4000-8000-000000000002';
insert into public.product_tags (product_id, tag_id)
values ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001');

-- Existing policies must reject ownership transfers as well as foreign parents.
do $test$
declare
  a uuid := '10000000-0000-4000-8000-000000000001';
  b uuid := '10000000-0000-4000-8000-000000000002';
  pa uuid := '20000000-0000-4000-8000-000000000001';
  pb uuid := '20000000-0000-4000-8000-000000000003';
  ta uuid := '30000000-0000-4000-8000-000000000001';
  tb uuid := '30000000-0000-4000-8000-000000000002';
  ra uuid := '40000000-0000-4000-8000-000000000001';
  rb uuid := '40000000-0000-4000-8000-000000000003';
  re uuid := '40000000-0000-4000-8000-000000000002';
  ia uuid := '50000000-0000-4000-8000-000000000001';
  n bigint;
  v_policy record;
  v_result boolean;
begin
  perform pg_temp.atomic_assert(auth.uid() = a, 'JWT subject A');
  perform pg_temp.atomic_assert(not exists(select 1 from public.products where id = pb), 'foreign products invisible');
  perform pg_temp.atomic_assert(not exists(select 1 from public.tags where id = tb), 'foreign tags invisible');
  perform pg_temp.atomic_expect_error(format('insert into public.routine_items (routine_id, product_id, user_id) values (%L,%L,%L)', rb, pa, a), '42501');
  perform pg_temp.atomic_expect_error(format('insert into public.routine_items (routine_id, product_id, user_id) values (%L,%L,%L)', ra, pb, a), '42501');
  perform pg_temp.atomic_expect_error(format('insert into public.routine_items (routine_id, product_id, user_id) values (%L,%L,%L)', re, pa, b), '42501');
  perform pg_temp.atomic_expect_error(format('update public.routine_items set routine_id=%L where id=%L', rb, ia), '42501');
  perform pg_temp.atomic_expect_error(format('update public.routine_items set product_id=%L where id=%L', pb, ia), '42501');
  perform pg_temp.atomic_expect_error(format('update public.routine_items set user_id=%L where id=%L', b, ia), '42501');
  perform pg_temp.atomic_expect_error(format('insert into public.product_tags values (%L,%L)', pa, tb), '42501');
  perform pg_temp.atomic_expect_error(format('insert into public.product_tags values (%L,%L)', pb, ta), '42501');
  perform pg_temp.atomic_expect_error(format('update public.product_tags set tag_id=%L where product_id=%L', tb, pa), '42501');
  perform pg_temp.atomic_expect_error(format('update public.product_tags set product_id=%L where product_id=%L', pb, pa), '42501');
  perform pg_temp.atomic_expect_error(format('insert into public.routines (start_date,copied_from) values (current_date,%L)', rb), '42501');
  perform pg_temp.atomic_expect_error(format('update public.routines set copied_from=%L where id=%L', rb, re), '42501');
  perform pg_temp.atomic_expect_error(format('update public.routines set user_id=%L where id=%L', b, re), '42501');
  perform pg_temp.atomic_expect_error(format('update public.products set user_id=%L where id=%L', b, pa), '42501');
  perform pg_temp.atomic_expect_error(format('update public.tags set user_id=%L where id=%L', b, ta), '42501');

  update public.routine_items set routine_id = re where id = ia;
  get diagnostics n = row_count;
  perform pg_temp.atomic_assert(n = 1, 'own item can move to own routine');
  update public.routine_items set routine_id = ra where id = ia;
  update public.routines set copied_from = ra where id = re;
  get diagnostics n = row_count;
  perform pg_temp.atomic_assert(n = 1, 'own copied_from accepted');
  update public.routines set copied_from = null where id = re;
  insert into public.routines (start_date, copied_from) values (current_date, ra);
  delete from public.routines where copied_from = ra;
  get diagnostics n = row_count;
  perform pg_temp.atomic_assert(n = 1, 'own copied routine INSERT and DELETE');
  update public.product_tags set tag_id = ta where product_id = pa;
  get diagnostics n = row_count;
  perform pg_temp.atomic_assert(n = 1, 'own link UPDATE');

  update public.routine_items set position = 99 where routine_id = rb;
  get diagnostics n = row_count;
  perform pg_temp.atomic_assert(n = 0, 'foreign UPDATE affects zero rows');
  delete from public.routines where id = rb;
  get diagnostics n = row_count;
  perform pg_temp.atomic_assert(n = 0, 'foreign DELETE affects zero rows');

  -- Evaluate the ACTUAL photo WITH CHECK expressions under authenticated RLS,
  -- without fabricating image paths that lifecycle validation would reject.
  select count(*) into n from pg_catalog.pg_policy
  where polrelid = 'public.routine_photos'::regclass
    and polname in ('routine_photos_insert_own', 'routine_photos_update_own');
  perform pg_temp.atomic_assert(n = 2, 'both photo policies exist');
  for v_policy in
    select polname, pg_catalog.pg_get_expr(polwithcheck, polrelid) as predicate
    from pg_catalog.pg_policy where polrelid = 'public.routine_photos'::regclass
      and polname in ('routine_photos_insert_own', 'routine_photos_update_own')
  loop
    execute format('select (%s) from (select %L::uuid as user_id, %L::uuid as routine_id) routine_photos', v_policy.predicate, a, ra) into v_result;
    perform pg_temp.atomic_assert(v_result, v_policy.polname || ': own photo allowed');
    execute format('select (%s) from (select %L::uuid as user_id, %L::uuid as routine_id) routine_photos', v_policy.predicate, a, rb) into v_result;
    perform pg_temp.atomic_assert(not v_result, v_policy.polname || ': foreign routine denied');
    execute format('select (%s) from (select %L::uuid as user_id, %L::uuid as routine_id) routine_photos', v_policy.predicate, b, ra) into v_result;
    perform pg_temp.atomic_assert(not v_result, v_policy.polname || ': foreign user denied');
  end loop;
end;
$test$;

-- Save contract, normalization, protected columns and failure rollback.
do $test$
declare
  v_id uuid;
  v_default_year_id uuid;
  v_created timestamptz;
  v_before jsonb;
  v_links jsonb;
  v_count bigint;
  v_tags_count bigint;
  v_bad jsonb;
  v_values jsonb := '{"brand":"Brand","name":"Saved","category":"care","volume":"50 ml","market_price":12.5,"actual_price":9.25,"shop":"Shop","rating":4,"expiry_date":"2028-12-31","opened_at":"2026-01-02","finished_at":null,"ingredients":"Water","notes":"Notes","year":2020,"image_path":null,"user_id":"10000000-0000-4000-8000-000000000002","id":"20000000-0000-4000-8000-000000000003","created_at":"2000-01-01T00:00:00Z"}';
begin
  v_id := public.save_product_with_tags(null, v_values,
    '[{"name":" Shared name ","color":"#ffffff"},{"name":" Zeta ","color":"#abcdef"},{"name":"zETA","color":"#000000"},{"name":"\tAlpha\n","color":" #123456 "}]');
  perform pg_temp.atomic_assert(v_id is not null and v_id <> '20000000-0000-4000-8000-000000000003'::uuid, 'create returns fresh ID');
  select created_at into v_created from public.products where id = v_id;
  perform pg_temp.atomic_assert(exists (
    select 1 from public.products where id = v_id and user_id = auth.uid()
      and brand = 'Brand' and name = 'Saved' and category = 'care' and volume = '50 ml'
      and market_price = 12.5 and actual_price = 9.25 and shop = 'Shop' and rating = 4
      and expiry_date = date '2028-12-31' and opened_at = date '2026-01-02'
      and finished_at is null and ingredients = 'Water' and notes = 'Notes'
      and year = 2020 and image_path is null and created_at <> timestamptz '2000-01-01T00:00:00Z'
  ), 'create form fields and protected ownership/created_at');
  perform pg_temp.atomic_assert((select count(*) = 3 from public.product_tags where product_id = v_id), 'trim and case-insensitive dedupe');
  perform pg_temp.atomic_assert(exists(select 1 from public.tags where name = 'Shared name' and color = '#111111'), 'existing tag color preserved');
  perform pg_temp.atomic_assert(exists(select 1 from public.tags where name = 'Zeta' and color = '#abcdef'), 'first duplicate wins');
  perform pg_temp.atomic_assert(exists(select 1 from public.tags where name = 'Alpha' and color = '#123456'), 'whitespace normalized');

  v_default_year_id := public.save_product_with_tags(null, '{"brand":"Default","name":"Year"}', '[]');
  perform pg_temp.atomic_assert(exists(select 1 from public.products where id = v_default_year_id and year = extract(year from current_date)), 'default current year');
  delete from public.products where id = v_default_year_id;
  v_default_year_id := public.save_product_with_tags(null, '{"brand":"Default","name":"Null year","year":null}', '[]');
  perform pg_temp.atomic_assert(exists(select 1 from public.products where id = v_default_year_id and year = extract(year from current_date)), 'null year uses current year');
  delete from public.products where id = v_default_year_id;

  perform pg_temp.atomic_assert(public.save_product_with_tags(v_id,
    (v_values - 'image_path') || '{"name":"Updated","year":1999,"finished_at":"2026-03-01"}',
    '[{"name":"shared NAME","color":"#000000"}]') = v_id, 'update returns same ID');
  perform pg_temp.atomic_assert(exists(select 1 from public.products where id = v_id
    and name = 'Updated' and year = 2020 and created_at = v_created and user_id = auth.uid()
    and finished_at = date '2026-03-01' and image_path is null), 'update preserves immutable fields and omitted image_path');
  perform pg_temp.atomic_assert((select count(*) = 1 from public.product_tags where product_id = v_id), 'tags fully replaced');

  select to_jsonb(p) into v_before from public.products p where p.id = v_id;
  select jsonb_agg(to_jsonb(pt) order by tag_id) into v_links from public.product_tags pt where product_id = v_id;
  select count(*) into v_count from public.products;
  select count(*) into v_tags_count from public.tags;
  foreach v_bad in array array[
    null::jsonb, 'null'::jsonb, '{}'::jsonb, '[null]'::jsonb,
    '[{"name":1,"color":"#ffffff"}]'::jsonb,
    '[{"name":"Missing color"}]'::jsonb,
    '[{"name":"Blank","color":" "}]'::jsonb,
    '[{"name":" ","color":"#ffffff"}]'::jsonb,
    '[{"name":"Valid first","color":"#ffffff"},{"name":"Invalid second","color":false}]'::jsonb
  ] loop
    perform pg_temp.atomic_expect_error(format('select public.save_product_with_tags(%L,%L::jsonb,%L::jsonb)', v_id, '{"name":"Must roll back"}', v_bad), '22023');
    perform pg_temp.atomic_expect_error(format('select public.save_product_with_tags(null,%L::jsonb,%L::jsonb)', '{"brand":"Failed","name":"Failed create"}', v_bad), '22023');
  end loop;
  perform pg_temp.atomic_expect_error(format('select public.save_product_with_tags(%L,null,%L::jsonb)', v_id, '[]'), '22023');
  perform pg_temp.atomic_expect_error(format('select public.save_product_with_tags(%L,%L::jsonb,%L::jsonb)', v_id, '[]', '[]'), '22023');
  perform pg_temp.atomic_expect_error('select public.save_product_with_tags(''20000000-0000-4000-8000-000000000003'', ''{}'', ''[]'')', 'P0002');
  perform pg_temp.atomic_expect_error('select public.save_product_with_tags(''ffffffff-ffff-4fff-8fff-ffffffffffff'', ''{}'', ''[]'')', 'P0002');

  perform set_config('atomic_domain_test.fail', 'product_link', true);
  perform pg_temp.atomic_expect_error(format('select public.save_product_with_tags(%L,%L::jsonb,%L::jsonb)', v_id,
    '{"brand":"Failed","name":"Must roll back"}', '[{"name":"Rollback new tag","color":"#123456"}]'), 'PZ001');
  perform pg_temp.atomic_expect_error('select public.save_product_with_tags(null, ''{"brand":"Failed","name":"Failed create"}'', ''[{"name":"Rollback create tag","color":"#123456"}]'')', 'PZ001');
  perform set_config('atomic_domain_test.fail', '', true);
  perform pg_temp.atomic_assert((select to_jsonb(p) = v_before from public.products p where p.id = v_id), 'failed save rolls back product changes');
  perform pg_temp.atomic_assert((select jsonb_agg(to_jsonb(pt) order by tag_id) = v_links from public.product_tags pt where product_id = v_id), 'failed save restores previous links');
  perform pg_temp.atomic_assert((select count(*) = v_count from public.products), 'failed create leaves no product');
  perform pg_temp.atomic_assert((select count(*) = v_tags_count from public.tags), 'failed save leaves no tags');

  perform public.save_product_with_tags(v_id, v_values || '{"image_path":null}', '[]');
  perform pg_temp.atomic_assert(not exists(select 1 from public.product_tags where product_id = v_id), 'empty tags clear links');
  perform pg_temp.atomic_assert((select count(*) = v_tags_count from public.tags), 'clearing links keeps catalog tags');
  delete from public.products where id = v_id;
end;
$test$;

-- Reorder is a full permutation and duplicate is a single atomic operation.
do $test$
declare
  r uuid := '40000000-0000-4000-8000-000000000001';
  i1 uuid := '50000000-0000-4000-8000-000000000001';
  i2 uuid := '50000000-0000-4000-8000-000000000002';
  v_copy uuid;
  v_empty_copy uuid;
  v_before jsonb;
  v_bad uuid[];
  v_routines bigint;
  v_items bigint;
begin
  perform public.set_routine_items_order(r, array[i2, i1]);
  perform pg_temp.atomic_assert((select position = 0 from public.routine_items where id = i2), 'first ID gets position 0');
  perform pg_temp.atomic_assert((select position = 1 from public.routine_items where id = i1), 'second ID gets position 1');
  select jsonb_agg(to_jsonb(i) order by id) into v_before from public.routine_items i where routine_id = r;

  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,null)', r), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,''{}''::uuid[])', r), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid])', r, i1), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,%L::uuid])', r, i1, i1), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,null::uuid])', r, i1), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[array[%L::uuid,%L::uuid]])', r, i1, i2), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,''50000000-0000-4000-8000-000000000003''::uuid])', r, i1), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,''50000000-0000-4000-8000-000000000004''::uuid])', r, i1), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,''ffffffff-ffff-4fff-8fff-ffffffffffff''::uuid])', r, i1), '22023');
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,%L::uuid,%L::uuid])', r, i1, i2, '50000000-0000-4000-8000-000000000004'), '22023');
  perform pg_temp.atomic_expect_error('select public.set_routine_items_order(''40000000-0000-4000-8000-000000000003'', ''{}''::uuid[])', 'P0002');
  perform pg_temp.atomic_expect_error('select public.set_routine_items_order(''ffffffff-ffff-4fff-8fff-ffffffffffff'', ''{}''::uuid[])', 'P0002');
  perform public.set_routine_items_order('40000000-0000-4000-8000-000000000002', '{}'::uuid[]);

  perform set_config('atomic_domain_test.fail', 'reorder', true);
  perform pg_temp.atomic_expect_error(format('select public.set_routine_items_order(%L,array[%L::uuid,%L::uuid])', r, i1, i2), 'PZ001');
  perform set_config('atomic_domain_test.fail', '', true);
  perform pg_temp.atomic_assert((select jsonb_agg(to_jsonb(i) order by id) = v_before from public.routine_items i where routine_id = r), 'invalid or failed reorder leaves all rows unchanged');

  -- Array lower bounds do not affect ordinality/zero-based positions.
  v_bad := array_fill(i1, array[2], array[0]);
  v_bad[1] := i2;
  perform public.set_routine_items_order(r, v_bad);
  perform pg_temp.atomic_assert((select position = 0 from public.routine_items where id = i1), 'nonstandard array lower bound');

  select count(*) into v_routines from public.routines;
  select count(*) into v_items from public.routine_items;
  perform pg_temp.atomic_expect_error('select public.duplicate_routine(''40000000-0000-4000-8000-000000000003'', current_date)', 'P0002');
  perform pg_temp.atomic_expect_error('select public.duplicate_routine(''ffffffff-ffff-4fff-8fff-ffffffffffff'', current_date)', 'P0002');
  perform pg_temp.atomic_expect_error(format('select public.duplicate_routine(%L,null)', r), '22023');
  perform set_config('atomic_domain_test.fail', 'duplicate', true);
  perform pg_temp.atomic_expect_error(format('select public.duplicate_routine(%L,%L::date)', r, '2027-04-05'), 'PZ001');
  perform set_config('atomic_domain_test.fail', '', true);
  perform pg_temp.atomic_assert((select count(*) = v_routines from public.routines), 'failed duplicate leaves no routine');
  perform pg_temp.atomic_assert((select count(*) = v_items from public.routine_items), 'failed duplicate leaves no children');

  v_copy := public.duplicate_routine(r, date '2027-04-05');
  perform pg_temp.atomic_assert(v_copy <> r and exists(select 1 from public.routines where id = v_copy
    and user_id = auth.uid() and name = 'Source (копия)' and copied_from = r
    and start_date = date '2027-04-05' and end_date is null and notes is null), 'duplicate routine contract');
  perform pg_temp.atomic_assert((select count(*) = 2 from public.routine_items where routine_id = v_copy), 'duplicate copies all items');
  perform pg_temp.atomic_assert(not exists (
    select 1 from public.routine_items src
    left join public.routine_items dst on dst.routine_id = v_copy and dst.product_id = src.product_id
    where src.routine_id = r and (dst.id is null or dst.id = src.id or dst.user_id <> auth.uid()
      or (dst.time_of_day, dst.is_constant, dst.mon, dst.tue, dst.wed, dst.thu, dst.fri, dst.sat, dst.sun, dst.position)
         is distinct from
         (src.time_of_day, src.is_constant, src.mon, src.tue, src.wed, src.thu, src.fri, src.sat, src.sun, src.position))
  ), 'duplicate preserves schedule/positions with new child IDs');
  perform pg_temp.atomic_assert(not exists(select 1 from public.routine_photos where routine_id = v_copy), 'duplicate contains no photos');
  v_empty_copy := public.duplicate_routine('40000000-0000-4000-8000-000000000002', current_date);
  perform pg_temp.atomic_assert(not exists(select 1 from public.routine_items where routine_id = v_empty_copy), 'empty routine duplication');
  delete from public.routines where id in (v_copy, v_empty_copy);
  perform pg_temp.atomic_assert(not exists(select 1 from public.routine_items where routine_id = v_copy), 'routine deletion cascade still works');
end;
$test$;

-- Missing JWT is rejected even by service_role; explicit owner predicates in
-- RPCs must continue to protect calls made by the RLS-bypassing service role.
reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select pg_temp.atomic_expect_error('select public.save_product_with_tags(null, ''{}'', ''[]'')', '42501');
select pg_temp.atomic_expect_error('select public.duplicate_routine(''40000000-0000-4000-8000-000000000001'', current_date)', '42501');
select pg_temp.atomic_expect_error('select public.set_routine_items_order(''40000000-0000-4000-8000-000000000001'', ''{}''::uuid[])', '42501');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"service_role"}', true);
select pg_temp.atomic_expect_error('select public.save_product_with_tags(''20000000-0000-4000-8000-000000000003'', ''{}'', ''[]'')', 'P0002');
select pg_temp.atomic_expect_error('select public.duplicate_routine(''40000000-0000-4000-8000-000000000003'', current_date)', 'P0002');
select pg_temp.atomic_expect_error('select public.set_routine_items_order(''40000000-0000-4000-8000-000000000003'', ''{}''::uuid[])', 'P0002');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

-- Deletes must not accidentally inherit the new WITH CHECK conditions.
delete from public.product_tags where product_id = '20000000-0000-4000-8000-000000000001';
select pg_temp.atomic_assert(not exists(select 1 from public.product_tags where product_id = '20000000-0000-4000-8000-000000000001'), 'own link deletion');
delete from public.routine_items where id = '50000000-0000-4000-8000-000000000004';
select pg_temp.atomic_assert(not exists(select 1 from public.routine_items where id = '50000000-0000-4000-8000-000000000004'), 'own item deletion');
delete from public.products where id = '20000000-0000-4000-8000-000000000002';
select pg_temp.atomic_assert(not exists(select 1 from public.routine_items where id = '50000000-0000-4000-8000-000000000002'), 'product deletion cascades to items');

-- Check the other owner's data survived all rejected attempts.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select pg_temp.atomic_assert(exists(select 1 from public.products where id = '20000000-0000-4000-8000-000000000003' and name = 'Other owner'), 'owner B product unchanged');
select pg_temp.atomic_assert(exists(select 1 from public.routine_items where id = '50000000-0000-4000-8000-000000000003' and position = 0), 'owner B item unchanged');
select pg_temp.atomic_assert(exists(select 1 from public.product_tags where product_id = '20000000-0000-4000-8000-000000000003' and tag_id = '30000000-0000-4000-8000-000000000002'), 'owner B link unchanged');
select pg_temp.atomic_assert(exists(select 1 from public.tags where id = '30000000-0000-4000-8000-000000000002' and color = '#222222'), 'owner B tag unchanged');

-- Narrow grants and invoker/search_path metadata are part of the API contract.
-- Resolve private helper signatures as postgres; no private-schema USAGE grant
-- is required by authenticated clients for pre-bound policies/triggers.
reset role;
do $test$
declare
  v_oid regprocedure;
begin
  foreach v_oid in array array[
    'public.save_product_with_tags(uuid,jsonb,jsonb)'::regprocedure,
    'public.duplicate_routine(uuid,date)'::regprocedure,
    'public.set_routine_items_order(uuid,uuid[])'::regprocedure,
    'private.lock_routine_items_parent()'::regprocedure,
    'private.atomic_owns_routine(uuid)'::regprocedure
  ] loop
    perform pg_temp.atomic_assert(not pg_catalog.has_function_privilege('anon', v_oid, 'EXECUTE'), 'anon cannot execute ' || v_oid::text);
    perform pg_temp.atomic_assert(pg_catalog.has_function_privilege('authenticated', v_oid, 'EXECUTE'), 'authenticated can execute ' || v_oid::text);
    perform pg_temp.atomic_assert(pg_catalog.has_function_privilege('service_role', v_oid, 'EXECUTE'), 'service_role can execute ' || v_oid::text);
    perform pg_temp.atomic_assert((select not prosecdef and proconfig @> array['search_path=""'] from pg_catalog.pg_proc where oid = v_oid), 'invoker and empty search_path: ' || v_oid::text);
    perform pg_temp.atomic_assert(not exists (
      select 1 from pg_catalog.pg_proc p, lateral pg_catalog.aclexplode(p.proacl) acl
      where p.oid = v_oid and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
    ), 'PUBLIC cannot execute ' || v_oid::text);
  end loop;
end;
$test$;

-- Auth admin deletion has no JWT subject. FK cascades must remain usable;
-- direct item writes still require a subject. The current schema already has
-- the auth.users cascades from account-delete-cascade.sql.
reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select pg_temp.atomic_expect_error('delete from public.routine_items where id = ''50000000-0000-4000-8000-000000000003''', '42501');
delete from auth.users where id = '10000000-0000-4000-8000-000000000002';
do $test$
begin
  if exists(select 1 from public.products where user_id = '10000000-0000-4000-8000-000000000002')
     or exists(select 1 from public.routines where user_id = '10000000-0000-4000-8000-000000000002')
     or exists(select 1 from public.routine_items where user_id = '10000000-0000-4000-8000-000000000002')
     or exists(select 1 from public.tags where user_id = '10000000-0000-4000-8000-000000000002') then
    raise exception 'ASSERTION FAILED: JWT-less admin account deletion must cascade';
  end if;
end;
$test$;

rollback;
