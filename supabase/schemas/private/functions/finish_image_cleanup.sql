CREATE OR REPLACE FUNCTION private.finish_image_cleanup (
  p_bucket      text,
  p_path        text,
  p_claim_token uuid,
  p_error       text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  update private.image_lifecycle set
    state = case when p_error is null and upload_settled then 'deleted' else 'pending' end,
    ready_at = now() + case when not upload_settled then interval '1 hour'
      else least(interval '1 hour', interval '30 seconds' * power(2, least(attempts, 7))) end,
    claim_token = null, last_error = left(p_error, 1000)
    where bucket = p_bucket and path = p_path and claim_token = p_claim_token and state = 'deleting';
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."finish_image_cleanup"(text, text, uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "private"."finish_image_cleanup"(text, text, uuid, text) FROM PUBLIC;
