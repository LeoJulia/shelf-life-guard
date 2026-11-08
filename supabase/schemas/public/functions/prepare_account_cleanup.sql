CREATE OR REPLACE FUNCTION public.prepare_account_cleanup (
  p_user_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.prepare_account_cleanup(p_user_id); $function$;

GRANT EXECUTE ON FUNCTION "public"."prepare_account_cleanup"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."prepare_account_cleanup"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."prepare_account_cleanup"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."prepare_account_cleanup"(uuid) FROM PUBLIC, "anon", "authenticated";
