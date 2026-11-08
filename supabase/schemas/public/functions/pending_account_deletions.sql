CREATE OR REPLACE FUNCTION public.pending_account_deletions (
  p_user_id uuid DEFAULT NULL::uuid
)
  RETURNS TABLE (
    user_id uuid
  )
  LANGUAGE sql
  SET search_path TO ''
  AS $function$ select * from private.pending_account_deletions(p_user_id); $function$;

GRANT EXECUTE ON FUNCTION "public"."pending_account_deletions"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."pending_account_deletions"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."pending_account_deletions"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."pending_account_deletions"(uuid) FROM PUBLIC, "anon", "authenticated";
