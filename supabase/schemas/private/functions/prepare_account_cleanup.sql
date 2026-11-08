CREATE OR REPLACE FUNCTION private.prepare_account_cleanup (
  p_user_id uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  perform 1 from private.account_deletions where user_id = p_user_id and completed_at is null for update;
  if not found then return false; end if;
  insert into private.image_lifecycle as q(bucket, path, user_id, state)
    select o.bucket_id, o.name, p_user_id, 'pending' from storage.objects o
    where o.bucket_id in ('product-images', 'routine-photos') and starts_with(o.name, p_user_id::text || '/')
      and not exists (select 1 from private.image_lifecycle j where j.bucket = o.bucket_id and j.path = o.name and j.state in ('uploading', 'pending', 'deleting'))
    order by o.bucket_id, o.name limit 100
    on conflict (bucket, path) do update set state = 'pending', ready_at = now();
  return not exists (select 1 from storage.objects o where o.bucket_id in ('product-images', 'routine-photos') and starts_with(o.name, p_user_id::text || '/'))
    and not exists (select 1 from private.image_lifecycle j where j.user_id = p_user_id and not j.upload_settled and j.created_at > now() - interval '1 hour');
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."prepare_account_cleanup"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "private"."prepare_account_cleanup"(uuid) FROM PUBLIC;
