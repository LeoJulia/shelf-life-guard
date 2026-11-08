CREATE OR REPLACE FUNCTION private.pending_account_deletions (
  p_user_id uuid DEFAULT NULL::uuid
)
  RETURNS TABLE (
    user_id uuid
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select d.user_id from private.account_deletions d
  where d.completed_at is null and (p_user_id is null or d.user_id = p_user_id)
    and (p_user_id is not null or d.ready_at <= now())
  order by d.ready_at limit 5;
$function$;

GRANT EXECUTE ON FUNCTION "private"."pending_account_deletions"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "private"."pending_account_deletions"(uuid) FROM PUBLIC;
