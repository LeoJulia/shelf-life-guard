CREATE OR REPLACE FUNCTION private.release_image_upload (
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
  update private.image_lifecycle set state = 'pending', ready_at = now()
    where bucket = p_bucket and path = p_path and user_id = auth.uid()
      and state = 'uploading' and upload_settled;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."release_image_upload"(text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "private"."release_image_upload"(text, text) FROM PUBLIC;
