CREATE OR REPLACE FUNCTION public.finish_account_cleanup (
  p_user_id uuid,
  p_error   text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.finish_account_cleanup(p_user_id, p_error); $function$;

GRANT EXECUTE ON FUNCTION "public"."finish_account_cleanup"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."finish_account_cleanup"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."finish_account_cleanup"(uuid, text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."finish_account_cleanup"(uuid, text) FROM PUBLIC, "anon", "authenticated";
