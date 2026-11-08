CREATE OR REPLACE FUNCTION private.reserve_image_upload (
  p_bucket text,
  p_path   text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "private"."reserve_image_upload"(text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."reserve_image_upload"(text, text) FROM PUBLIC;
