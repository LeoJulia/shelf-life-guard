CREATE OR REPLACE FUNCTION public.reserve_image_upload (
  p_bucket text,
  p_path   text
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.reserve_image_upload(p_bucket, p_path); $function$;

GRANT EXECUTE ON FUNCTION "public"."reserve_image_upload"(text, text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."reserve_image_upload"(text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."reserve_image_upload"(text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."reserve_image_upload"(text, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."reserve_image_upload"(text, text) FROM PUBLIC, "anon";
