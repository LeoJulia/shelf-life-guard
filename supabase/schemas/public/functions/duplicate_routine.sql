CREATE OR REPLACE FUNCTION public.duplicate_routine (
  p_source_id  uuid,
  p_start_date date
)
  RETURNS uuid
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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

GRANT EXECUTE ON FUNCTION "public"."duplicate_routine"(uuid, date) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."duplicate_routine"(uuid, date) TO "service_role";

REVOKE ALL ON FUNCTION "public"."duplicate_routine"(uuid, date) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."duplicate_routine"(uuid, date) TO "postgres";

REVOKE ALL ON FUNCTION "public"."duplicate_routine"(uuid, date) FROM PUBLIC, "anon";
