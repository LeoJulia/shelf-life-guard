CREATE OR REPLACE FUNCTION private.lock_routine_items_parent()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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

GRANT EXECUTE ON FUNCTION "private"."lock_routine_items_parent"() TO "authenticated", "service_role";

REVOKE ALL ON FUNCTION "private"."lock_routine_items_parent"() FROM PUBLIC;
