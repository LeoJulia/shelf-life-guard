-- Standalone deployment; requires the existing schema, rls-with-check-fix.sql,
-- and tags-name-per-user-unique.sql. No Storage objects are changed here.
begin;
set local lock_timeout = '5s';

create schema if not exists private;

-- A separate PL/pgSQL read avoids recursive policy expansion when routines
-- are row-locked (which also invokes UPDATE policies). This helper remains an
-- invoker: its SELECT is subject to the ordinary routines SELECT policy.
create or replace function private.atomic_owns_routine(p_id uuid)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then return false; end if;
  return exists (select 1 from public.routines r where r.id = p_id and r.user_id = v_user_id);
end;
$function$;
revoke execute on function private.atomic_owns_routine(uuid) from public, anon;
grant execute on function private.atomic_owns_routine(uuid) to authenticated, service_role;

-- Keep the existing USING/DELETE policies: a user can still remove an owned
-- child even if a parent has gone away. Validate BOTH ends of new relationships.
alter policy routine_items_insert_own on public.routine_items
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.routines r
                where r.id = routine_items.routine_id and r.user_id = (select auth.uid()))
    and exists (select 1 from public.products p
                where p.id = routine_items.product_id and p.user_id = (select auth.uid()))
  );
alter policy routine_items_update_own on public.routine_items
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.routines r
                where r.id = routine_items.routine_id and r.user_id = (select auth.uid()))
    and exists (select 1 from public.products p
                where p.id = routine_items.product_id and p.user_id = (select auth.uid()))
  );
alter policy routine_photos_insert_own on public.routine_photos
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.routines r
                where r.id = routine_photos.routine_id and r.user_id = (select auth.uid()))
  );
alter policy routine_photos_update_own on public.routine_photos
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.routines r
                where r.id = routine_photos.routine_id and r.user_id = (select auth.uid()))
  );
alter policy "Users can access own product tags" on public.product_tags
  with check (
    exists (select 1 from public.products p
            where p.id = product_tags.product_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.tags t
                where t.id = product_tags.tag_id and t.user_id = (select auth.uid()))
  );
alter policy routines_insert_own on public.routines
  with check (
    user_id = (select auth.uid())
    and (copied_from is null or private.atomic_owns_routine(copied_from))
  );
alter policy routines_update_own on public.routines
  with check (
    user_id = (select auth.uid())
    and (copied_from is null or private.atomic_owns_routine(copied_from))
  );

-- Reorder/duplicate take the parent lock before reading the membership set.
-- Direct item UPDATE/DELETE already have a child tuple lock before a row trigger
-- runs. Waiting here could deadlock against parent-first reorder or ON DELETE
-- CASCADE. NOWAIT instead aborts the competing statement (55P03); retry its WHOLE
-- transaction. NO KEY UPDATE is compatible with FK KEY SHARE locks. Moving an
-- item locks both parents in UUID order. A deleted parent needs no extra lock;
-- this deliberately does not require a visible parent for DELETE/cascade.
-- Multi-parent/bulk writes can also receive 55P03; this is preferable to a hidden
-- lock-order cycle. Direct item writes need a JWT subject. Nested DELETEs are
-- exempt from the subject requirement: auth.admin.deleteUser cascades have no
-- end-user JWT and are already authorized at the parent; they still take locks.
create or replace function private.lock_routine_items_parent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_old_id uuid;
  v_new_id uuid;
begin
  if auth.uid() is null and not (tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() > 1) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if tg_op <> 'INSERT' then v_old_id := old.routine_id; end if;
  if tg_op <> 'DELETE' then v_new_id := new.routine_id; end if;

  perform r.id from public.routines r
  where r.id in (v_old_id, v_new_id)
  order by r.id
  for no key update nowait;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

revoke execute on function private.lock_routine_items_parent() from public, anon;
grant execute on function private.lock_routine_items_parent() to authenticated, service_role;
-- Trigger invocation does not require granting access to the private schema.
drop trigger if exists atomic_lock_routine_items_parent on public.routine_items;
create trigger atomic_lock_routine_items_parent
  before insert or update or delete on public.routine_items
  for each row execute function private.lock_routine_items_parent();

-- Full form replacement (not a JSON merge patch), plus optional image_path.
-- p_tags is the complete desired tag set; [] clears links, not the tag catalog.
-- First normalized occurrence wins; an existing tag keeps its name and color.
-- Only the explicitly listed fields are written; id/user_id/created_at are never
-- taken from JSON, and year is accepted on create only (NULL => current year).
create or replace function public.save_product_with_tags(
  p_product_id uuid default null,
  p_values jsonb default '{}'::jsonb,
  p_tags jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_product_id uuid;
  v_tag_id uuid;
  v_tag record;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(p_values) is distinct from 'object' then
    raise exception 'Product values must be an object' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_tags) is distinct from 'array' then
    raise exception 'Tags must be an array' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_tags) as e(value)
    where pg_catalog.jsonb_typeof(e.value) is distinct from 'object'
       or pg_catalog.jsonb_typeof(e.value -> 'name') is distinct from 'string'
       or pg_catalog.jsonb_typeof(e.value -> 'color') is distinct from 'string'
       or pg_catalog.regexp_replace(e.value ->> 'name', '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
       or pg_catalog.regexp_replace(e.value ->> 'color', '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
  ) then
    raise exception 'Each tag needs a nonblank string name and color' using errcode = '22023';
  end if;

  if p_product_id is null then
    insert into public.products (
      user_id, brand, name, category, volume, market_price, actual_price,
      shop, rating, expiry_date, opened_at, finished_at, ingredients, notes,
      image_path, year
    ) values (
      v_user_id, coalesce(p_values ->> 'brand', ''), coalesce(p_values ->> 'name', ''),
      p_values ->> 'category', p_values ->> 'volume',
      nullif(p_values ->> 'market_price', '')::numeric,
      nullif(p_values ->> 'actual_price', '')::numeric,
      p_values ->> 'shop', nullif(p_values ->> 'rating', '')::numeric,
      nullif(p_values ->> 'expiry_date', '')::date,
      nullif(p_values ->> 'opened_at', '')::date,
      nullif(p_values ->> 'finished_at', '')::date,
      p_values ->> 'ingredients', p_values ->> 'notes', p_values ->> 'image_path',
      coalesce(nullif(p_values ->> 'year', '')::numeric, extract(year from current_date))
    ) returning id into v_product_id;
  else
    select p.id into v_product_id from public.products p
    where p.id = p_product_id and p.user_id = v_user_id
    for update;
    if not found then
      raise exception 'Product not found or inaccessible' using errcode = 'P0002';
    end if;

    update public.products p set
      brand = coalesce(p_values ->> 'brand', ''),
      name = coalesce(p_values ->> 'name', ''),
      category = p_values ->> 'category',
      volume = p_values ->> 'volume',
      market_price = nullif(p_values ->> 'market_price', '')::numeric,
      actual_price = nullif(p_values ->> 'actual_price', '')::numeric,
      shop = p_values ->> 'shop',
      rating = nullif(p_values ->> 'rating', '')::numeric,
      expiry_date = nullif(p_values ->> 'expiry_date', '')::date,
      opened_at = nullif(p_values ->> 'opened_at', '')::date,
      finished_at = nullif(p_values ->> 'finished_at', '')::date,
      ingredients = p_values ->> 'ingredients',
      notes = p_values ->> 'notes',
      image_path = case when p_values ? 'image_path' then p_values ->> 'image_path' else p.image_path end
    where p.id = v_product_id and p.user_id = v_user_id;
  end if;

  delete from public.product_tags where product_id = v_product_id;
  for v_tag in
    select distinct on (pg_catalog.lower(n.name)) n.name, n.color
    from pg_catalog.jsonb_array_elements(p_tags) with ordinality as e(value, ordinal)
    cross join lateral (
      select pg_catalog.regexp_replace(e.value ->> 'name', '^[[:space:]]+|[[:space:]]+$', '', 'g') as name,
             pg_catalog.regexp_replace(e.value ->> 'color', '^[[:space:]]+|[[:space:]]+$', '', 'g') as color
    ) n
    order by pg_catalog.lower(n.name), e.ordinal
  loop
    -- The no-op update locks and returns the conflict row even when another
    -- transaction just created it; DO NOTHING + SELECT has a snapshot race.
    insert into public.tags as existing (user_id, name, color)
    values (v_user_id, v_tag.name, v_tag.color)
    on conflict (user_id, (pg_catalog.lower(name)))
      do update set name = existing.name
    returning id into v_tag_id;

    insert into public.product_tags (product_id, tag_id)
    values (v_product_id, v_tag_id);
  end loop;
  return v_product_id;
end;
$function$;

-- Match the existing duplicate action: copied name suffix, fresh dates,
-- no notes/end date/photos; preserve item schedule and positions.
create or replace function public.duplicate_routine(p_source_id uuid, p_start_date date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_source public.routines%rowtype;
  v_copy_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_start_date is null then
    raise exception 'Start date is required' using errcode = '22023';
  end if;
  select r.* into v_source from public.routines r
  where r.id = p_source_id and r.user_id = v_user_id
  for no key update;
  if not found then
    raise exception 'Routine not found or inaccessible' using errcode = 'P0002';
  end if;

  insert into public.routines (user_id, name, start_date, end_date, notes, copied_from)
  values (
    v_user_id,
    case when coalesce(v_source.name, '') <> '' then v_source.name || ' (копия)' else null end,
    p_start_date, null, null, v_source.id
  ) returning id into v_copy_id;

  insert into public.routine_items (
    routine_id, user_id, product_id, time_of_day, is_constant,
    mon, tue, wed, thu, fri, sat, sun, position
  )
  select v_copy_id, v_user_id, i.product_id, i.time_of_day, i.is_constant,
         i.mon, i.tue, i.wed, i.thu, i.fri, i.sat, i.sun, i.position
  from public.routine_items i
  where i.routine_id = v_source.id and i.user_id = v_user_id
  order by i.position, i.id;

  return v_copy_id;
end;
$function$;

-- A complete permutation is required. Positions are zero-based, as in the UI.
-- The parent lock stabilizes membership until transaction end; the mutation
-- trigger makes direct INSERT/UPDATE/DELETE participate in the same protocol.
create or replace function public.set_routine_items_order(p_routine_id uuid, p_ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_count bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  perform r.id from public.routines r
  where r.id = p_routine_id and r.user_id = v_user_id
  for no key update;
  if not found then
    raise exception 'Routine not found or inaccessible' using errcode = 'P0002';
  end if;
  if p_ordered_ids is null or coalesce(pg_catalog.array_ndims(p_ordered_ids), 1) <> 1 then
    raise exception 'Order must be a nonnull one-dimensional array' using errcode = '22023';
  end if;
  if exists (select 1 from pg_catalog.unnest(p_ordered_ids) as ids(id) where id is null)
     or (select count(distinct id) from pg_catalog.unnest(p_ordered_ids) as ids(id))
        <> pg_catalog.cardinality(p_ordered_ids) then
    raise exception 'Order contains null or duplicate IDs' using errcode = '22023';
  end if;
  select count(*) into v_count from public.routine_items i where i.routine_id = p_routine_id;
  if v_count <> pg_catalog.cardinality(p_ordered_ids) or exists (
    select 1 from pg_catalog.unnest(p_ordered_ids) as ids(id)
    where not exists (
      select 1 from public.routine_items i
      where i.id = ids.id and i.routine_id = p_routine_id and i.user_id = v_user_id
    )
  ) then
    raise exception 'Order must contain every current item exactly once' using errcode = '22023';
  end if;

  update public.routine_items i
  set position = (ids.ordinal - 1)::integer
  from pg_catalog.unnest(p_ordered_ids) with ordinality as ids(id, ordinal)
  where i.id = ids.id and i.routine_id = p_routine_id and i.user_id = v_user_id;
end;
$function$;

revoke execute on function public.save_product_with_tags(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.duplicate_routine(uuid, date) from public, anon;
revoke execute on function public.set_routine_items_order(uuid, uuid[]) from public, anon;
grant execute on function public.save_product_with_tags(uuid, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.duplicate_routine(uuid, date) to authenticated, service_role;
grant execute on function public.set_routine_items_order(uuid, uuid[]) to authenticated, service_role;

commit;
