CREATE OR REPLACE FUNCTION private.request_account_deletion()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 741));
  if exists (select 1 from private.account_deletions where user_id = owner_id) then return; end if;
  update public.products set image_path = null where user_id = owner_id and image_path is not null;
  delete from public.routine_photos where user_id = owner_id;
  insert into private.account_deletions(user_id) values (owner_id);
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."request_account_deletion"() TO "authenticated";

REVOKE ALL ON FUNCTION "private"."request_account_deletion"() FROM PUBLIC;
