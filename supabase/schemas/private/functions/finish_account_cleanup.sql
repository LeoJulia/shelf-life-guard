CREATE OR REPLACE FUNCTION private.finish_account_cleanup (
  p_user_id uuid,
  p_error   text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  update private.account_deletions set last_error = left(p_error, 1000), ready_at = now() + interval '1 minute',
    completed_at = case when p_error is null then now() else null end
  where user_id = p_user_id;
$function$;

GRANT EXECUTE ON FUNCTION "private"."finish_account_cleanup"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "private"."finish_account_cleanup"(uuid, text) FROM PUBLIC;
