CREATE OR REPLACE FUNCTION public.set_routine_items_order (
  p_routine_id  uuid,
  p_ordered_ids uuid[]
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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

GRANT EXECUTE ON FUNCTION "public"."set_routine_items_order"(uuid, uuid[]) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."set_routine_items_order"(uuid, uuid[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."set_routine_items_order"(uuid, uuid[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_routine_items_order"(uuid, uuid[]) TO "postgres";

REVOKE ALL ON FUNCTION "public"."set_routine_items_order"(uuid, uuid[]) FROM PUBLIC, "anon";
