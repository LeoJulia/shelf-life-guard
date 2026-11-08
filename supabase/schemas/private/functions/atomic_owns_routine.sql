CREATE OR REPLACE FUNCTION private.atomic_owns_routine (
  p_id uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then return false; end if;
  return exists (select 1 from public.routines r where r.id = p_id and r.user_id = v_user_id);
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."atomic_owns_routine"(uuid) TO "authenticated", "service_role";

REVOKE ALL ON FUNCTION "private"."atomic_owns_routine"(uuid) FROM PUBLIC;
