CREATE OR REPLACE FUNCTION public.claim_image_cleanup (
  p_limit integer DEFAULT 100
)
  RETURNS TABLE (
    bucket      text,
    path        text,
    claim_token uuid
  )
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select * from private.claim_image_cleanup(p_limit); $function$;

GRANT EXECUTE ON FUNCTION "public"."claim_image_cleanup"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."claim_image_cleanup"(integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."claim_image_cleanup"(integer) TO "postgres";

REVOKE ALL ON FUNCTION "public"."claim_image_cleanup"(integer) FROM PUBLIC, "anon", "authenticated";
