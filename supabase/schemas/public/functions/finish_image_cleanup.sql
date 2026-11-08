CREATE OR REPLACE FUNCTION public.finish_image_cleanup (
  p_bucket      text,
  p_path        text,
  p_claim_token uuid,
  p_error       text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.finish_image_cleanup(p_bucket, p_path, p_claim_token, p_error); $function$;

GRANT EXECUTE ON FUNCTION "public"."finish_image_cleanup"(text, text, uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."finish_image_cleanup"(text, text, uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."finish_image_cleanup"(text, text, uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."finish_image_cleanup"(text, text, uuid, text) FROM PUBLIC, "anon", "authenticated";
