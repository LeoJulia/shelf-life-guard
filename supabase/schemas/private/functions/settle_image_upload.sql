CREATE OR REPLACE FUNCTION private.settle_image_upload (
  p_bucket text,
  p_path   text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  update private.image_lifecycle set upload_settled = true
    where bucket = p_bucket and path = p_path and user_id = auth.uid() and state = 'uploading';
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."settle_image_upload"(text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."settle_image_upload"(text, text) FROM PUBLIC;
