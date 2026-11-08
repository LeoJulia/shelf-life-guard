CREATE OR REPLACE FUNCTION public.request_account_deletion()
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select private.request_account_deletion(); $function$;

GRANT EXECUTE ON FUNCTION "public"."request_account_deletion"() TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."request_account_deletion"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."request_account_deletion"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."request_account_deletion"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."request_account_deletion"() FROM PUBLIC, "anon";
