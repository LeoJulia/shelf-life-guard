CREATE OR REPLACE FUNCTION private.storage_account_active (
  object_name text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null or split_part(object_name, '/', 1) <> auth.uid()::text then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended(auth.uid()::text, 741));
  return exists (select 1 from auth.users where id = auth.uid())
    and not exists (select 1 from private.account_deletions where user_id = auth.uid());
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."storage_account_active"(text) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."storage_account_active"(text) FROM PUBLIC;
