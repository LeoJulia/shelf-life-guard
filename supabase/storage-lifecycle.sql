begin;
set local lock_timeout = '5s';

create schema if not exists private;

create table if not exists private.image_lifecycle (
  bucket text not null check (bucket in ('product-images', 'routine-photos')),
  path text not null,
  user_id uuid not null,
  state text not null check (state in ('uploading', 'attached', 'pending', 'deleting', 'deleted')),
  upload_settled boolean not null default true,
  ready_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  claim_token uuid,
  attempts integer not null default 0,
  last_error text,
  primary key (bucket, path)
);
create index if not exists image_lifecycle_due_idx on private.image_lifecycle (ready_at)
  where state in ('uploading', 'pending', 'deleting');
create index if not exists image_lifecycle_user_idx on private.image_lifecycle (user_id);

create table if not exists private.account_deletions (
  user_id uuid primary key,
  requested_at timestamptz not null default now(),
  ready_at timestamptz not null default now(),
  completed_at timestamptz,
  last_error text
);
alter table private.image_lifecycle enable row level security;
alter table private.account_deletions enable row level security;
revoke all on private.image_lifecycle, private.account_deletions from public, anon, authenticated;

create or replace function private.guard_account_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
  if tg_table_name = 'product_tags' then
    select user_id into owner_id from public.products where id = new.product_id;
  else
    owner_id := new.user_id;
  end if;
  perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended(owner_id::text, 741));
  if exists (select 1 from private.account_deletions where user_id = owner_id) then
    if tg_table_name = 'routines' and tg_op = 'UPDATE' then
      if new.copied_from is null and old.copied_from is not null
         and (to_jsonb(new) - 'copied_from') = (to_jsonb(old) - 'copied_from') then
        return new;
      end if;
    end if;
    raise exception 'Account deletion is in progress' using errcode = '55000';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_account_write() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['products', 'tags', 'product_tags', 'routines', 'routine_items', 'routine_photos'] loop
    execute format('drop trigger if exists guard_account_write on public.%I', table_name);
    execute format('create trigger guard_account_write before insert or update on public.%I for each row execute function private.guard_account_write()', table_name);
  end loop;
end;
$$;

create or replace function private.track_image_reference() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  image_bucket text := case when tg_table_name = 'products' then 'product-images' else 'routine-photos' end;
  old_path text;
  new_path text;
  image_owner uuid;
  current_state text;
  upload_deadline timestamptz;
begin
  if tg_op <> 'INSERT' then old_path := old.image_path; end if;
  if tg_op <> 'DELETE' then new_path := new.image_path; end if;
  if old_path is not distinct from new_path then return null; end if;

  if new_path is not null then
    image_owner := new.user_id;
    if split_part(new_path, '/', 1) <> image_owner::text then
      raise exception 'Image belongs to another account' using errcode = '42501';
    end if;
    insert into private.image_lifecycle(bucket, path, user_id, state)
    values (image_bucket, new_path, image_owner, 'attached') on conflict do nothing;
    select state, ready_at into current_state, upload_deadline
      from private.image_lifecycle where bucket = image_bucket and path = new_path for update;
    if current_state not in ('uploading', 'attached') or
       (current_state = 'uploading' and upload_deadline <= now()) then
      raise exception 'Image upload has expired or is being deleted' using errcode = '55000';
    end if;
    update private.image_lifecycle set state = 'attached', upload_settled = true, last_error = null
      where bucket = image_bucket and path = new_path;
  end if;

  if old_path is not null and split_part(old_path, '/', 1) = old.user_id::text then
    insert into private.image_lifecycle(bucket, path, user_id, state)
    values (image_bucket, old_path, old.user_id, 'attached') on conflict do nothing;
    perform 1 from private.image_lifecycle
      where bucket = image_bucket and path = old_path and user_id = old.user_id for update;
    if not found then return null; end if;
    if not exists (select 1 from public.products where image_bucket = 'product-images' and image_path = old_path)
       and not exists (select 1 from public.routine_photos where image_bucket = 'routine-photos' and image_path = old_path) then
      update private.image_lifecycle set state = 'pending', ready_at = now(), claim_token = null
        where bucket = image_bucket and path = old_path;
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.track_image_reference() from public, anon, authenticated;
drop trigger if exists track_image_reference on public.products;
create trigger track_image_reference after insert or update or delete on public.products
  for each row execute function private.track_image_reference();
drop trigger if exists track_image_reference on public.routine_photos;
create trigger track_image_reference after insert or update or delete on public.routine_photos
  for each row execute function private.track_image_reference();

create or replace function private.reserve_image_upload(p_bucket text, p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null or split_part(p_path, '/', 1) <> owner_id::text then
    raise exception 'Invalid image owner' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended(owner_id::text, 741));
  if exists (select 1 from private.account_deletions where user_id = owner_id) then
    raise exception 'Account deletion is in progress' using errcode = '55000';
  end if;
  insert into private.image_lifecycle(bucket, path, user_id, state, upload_settled, ready_at)
    values (p_bucket, p_path, owner_id, 'uploading', false, now() + interval '1 hour');
end;
$$;

create or replace function private.settle_image_upload(p_bucket text, p_path text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  update private.image_lifecycle set upload_settled = true
    where bucket = p_bucket and path = p_path and user_id = auth.uid() and state = 'uploading';
end;
$$;

create or replace function private.release_image_upload(p_bucket text, p_path text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  update private.image_lifecycle set state = 'pending', ready_at = now()
    where bucket = p_bucket and path = p_path and user_id = auth.uid()
      and state = 'uploading' and upload_settled;
end;
$$;

create or replace function private.claim_image_cleanup(p_limit integer default 100)
returns table(bucket text, path text, claim_token uuid)
language plpgsql security definer set search_path = '' as $$
declare job private.image_lifecycle;
begin
  for job in select q.* from private.image_lifecycle q
    where q.state in ('uploading', 'pending', 'deleting') and q.ready_at <= now()
    order by q.ready_at limit least(greatest(p_limit, 1), 100) for update skip locked
  loop
    if exists (select 1 from public.products p where job.bucket = 'product-images' and p.image_path = job.path)
       or exists (select 1 from public.routine_photos p where job.bucket = 'routine-photos' and p.image_path = job.path) then
      update private.image_lifecycle q set state = 'attached', upload_settled = true where q.bucket = job.bucket and q.path = job.path;
      continue;
    end if;
    update private.image_lifecycle q
      set state = 'deleting', ready_at = now() + interval '5 minutes', claim_token = gen_random_uuid(), attempts = attempts + 1
      where q.bucket = job.bucket and q.path = job.path
      returning q.bucket, q.path, q.claim_token into bucket, path, claim_token;
    return next;
  end loop;
end;
$$;

create or replace function private.finish_image_cleanup(p_bucket text, p_path text, p_claim_token uuid, p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update private.image_lifecycle set
    state = case when p_error is null and upload_settled then 'deleted' else 'pending' end,
    ready_at = now() + case when not upload_settled then interval '1 hour'
      else least(interval '1 hour', interval '30 seconds' * power(2, least(attempts, 7))) end,
    claim_token = null, last_error = left(p_error, 1000)
    where bucket = p_bucket and path = p_path and claim_token = p_claim_token and state = 'deleting';
end;
$$;

create or replace function private.request_account_deletion() returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 741));
  if exists (select 1 from private.account_deletions where user_id = owner_id) then return; end if;
  update public.products set image_path = null where user_id = owner_id and image_path is not null;
  delete from public.routine_photos where user_id = owner_id;
  insert into private.account_deletions(user_id) values (owner_id);
end;
$$;

create or replace function private.pending_account_deletions(p_user_id uuid default null)
returns table(user_id uuid) language sql security definer set search_path = '' as $$
  select d.user_id from private.account_deletions d
  where d.completed_at is null and (p_user_id is null or d.user_id = p_user_id)
    and (p_user_id is not null or d.ready_at <= now())
  order by d.ready_at limit 5;
$$;

create or replace function private.prepare_account_cleanup(p_user_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from private.account_deletions where user_id = p_user_id and completed_at is null for update;
  if not found then return false; end if;
  insert into private.image_lifecycle as q(bucket, path, user_id, state)
    select o.bucket_id, o.name, p_user_id, 'pending' from storage.objects o
    where o.bucket_id in ('product-images', 'routine-photos') and starts_with(o.name, p_user_id::text || '/')
      and not exists (select 1 from private.image_lifecycle j where j.bucket = o.bucket_id and j.path = o.name and j.state in ('uploading', 'pending', 'deleting'))
    order by o.bucket_id, o.name limit 100
    on conflict (bucket, path) do update set state = 'pending', ready_at = now();
  return not exists (select 1 from storage.objects o where o.bucket_id in ('product-images', 'routine-photos') and starts_with(o.name, p_user_id::text || '/'))
    and not exists (select 1 from private.image_lifecycle j where j.user_id = p_user_id and not j.upload_settled and j.created_at > now() - interval '1 hour');
end;
$$;

create or replace function private.finish_account_cleanup(p_user_id uuid, p_error text default null) returns void
language sql security definer set search_path = '' as $$
  update private.account_deletions set last_error = left(p_error, 1000), ready_at = now() + interval '1 minute',
    completed_at = case when p_error is null then now() else null end
  where user_id = p_user_id;
$$;

create or replace function private.storage_account_active(object_name text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or split_part(object_name, '/', 1) <> auth.uid()::text then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended(auth.uid()::text, 741));
  return exists (select 1 from auth.users where id = auth.uid())
    and not exists (select 1 from private.account_deletions where user_id = auth.uid());
end;
$$;
revoke all on function private.storage_account_active(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.storage_account_active(text) to authenticated;
drop policy if exists storage_active_account_insert on storage.objects;
create policy storage_active_account_insert on storage.objects as restrictive for insert to authenticated
  with check (bucket_id not in ('product-images', 'routine-photos') or private.storage_account_active(name));
drop policy if exists storage_active_account_update on storage.objects;
create policy storage_active_account_update on storage.objects as restrictive for update to authenticated
  using (bucket_id not in ('product-images', 'routine-photos') or private.storage_account_active(name))
  with check (bucket_id not in ('product-images', 'routine-photos') or private.storage_account_active(name));

revoke all on function private.reserve_image_upload(text,text), private.settle_image_upload(text,text),
  private.release_image_upload(text,text), private.request_account_deletion() from public, anon;
grant execute on function private.reserve_image_upload(text,text), private.settle_image_upload(text,text),
  private.release_image_upload(text,text), private.request_account_deletion() to authenticated;
revoke all on function private.claim_image_cleanup(integer), private.finish_image_cleanup(text,text,uuid,text),
  private.pending_account_deletions(uuid), private.prepare_account_cleanup(uuid), private.finish_account_cleanup(uuid,text)
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_image_cleanup(integer), private.finish_image_cleanup(text,text,uuid,text),
  private.pending_account_deletions(uuid), private.prepare_account_cleanup(uuid), private.finish_account_cleanup(uuid,text)
  to service_role;

create or replace function public.reserve_image_upload(p_bucket text, p_path text) returns void
language sql security invoker set search_path = '' as $$ select private.reserve_image_upload(p_bucket, p_path); $$;
create or replace function public.settle_image_upload(p_bucket text, p_path text) returns void
language sql security invoker set search_path = '' as $$ select private.settle_image_upload(p_bucket, p_path); $$;
create or replace function public.release_image_upload(p_bucket text, p_path text) returns void
language sql security invoker set search_path = '' as $$ select private.release_image_upload(p_bucket, p_path); $$;
create or replace function public.request_account_deletion() returns void
language sql security invoker set search_path = '' as $$ select private.request_account_deletion(); $$;
create or replace function public.claim_image_cleanup(p_limit integer default 100)
returns table(bucket text, path text, claim_token uuid)
language sql security invoker set search_path = '' as $$ select * from private.claim_image_cleanup(p_limit); $$;
create or replace function public.finish_image_cleanup(p_bucket text, p_path text, p_claim_token uuid, p_error text default null) returns void
language sql security invoker set search_path = '' as $$ select private.finish_image_cleanup(p_bucket, p_path, p_claim_token, p_error); $$;
create or replace function public.pending_account_deletions(p_user_id uuid default null) returns table(user_id uuid)
language sql security invoker set search_path = '' as $$ select * from private.pending_account_deletions(p_user_id); $$;
create or replace function public.prepare_account_cleanup(p_user_id uuid) returns boolean
language sql security invoker set search_path = '' as $$ select private.prepare_account_cleanup(p_user_id); $$;
create or replace function public.finish_account_cleanup(p_user_id uuid, p_error text default null) returns void
language sql security invoker set search_path = '' as $$ select private.finish_account_cleanup(p_user_id, p_error); $$;

revoke all on function public.reserve_image_upload(text,text), public.settle_image_upload(text,text),
  public.release_image_upload(text,text), public.request_account_deletion() from public, anon;
grant execute on function public.reserve_image_upload(text,text), public.settle_image_upload(text,text),
  public.release_image_upload(text,text), public.request_account_deletion() to authenticated;
revoke all on function public.claim_image_cleanup(integer), public.finish_image_cleanup(text,text,uuid,text),
  public.pending_account_deletions(uuid), public.prepare_account_cleanup(uuid), public.finish_account_cleanup(uuid,text)
  from public, anon, authenticated;
grant execute on function public.claim_image_cleanup(integer), public.finish_image_cleanup(text,text,uuid,text),
  public.pending_account_deletions(uuid), public.prepare_account_cleanup(uuid), public.finish_account_cleanup(uuid,text)
  to service_role;

commit;
