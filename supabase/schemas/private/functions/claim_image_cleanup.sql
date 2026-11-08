CREATE OR REPLACE FUNCTION private.claim_image_cleanup (
  p_limit integer DEFAULT 100
)
  RETURNS TABLE (
    bucket      text,
    path        text,
    claim_token uuid
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare job private.image_lifecycle;
begin
  for job in select q.* from private.image_lifecycle q
    where q.state in ('uploading', 'pending', 'deleting') and q.ready_at <= now()
    order by q.ready_at limit least(greatest(p_limit, 1), 100) for update skip locked
  loop
    if exists (select 1 from public.products p where job.bucket = 'product-images' and p.image_path = job.path)
       or exists (select 1 from public.routine_photos p where job.bucket = 'routine-photos' and p.image_path = job.path) then
      update private.image_lifecycle q set state = 'attached', upload_settled = true where q.bucket = job.bucket and q.path = job.path;
      continue;
    end if;
    update private.image_lifecycle q
      set state = 'deleting', ready_at = now() + interval '5 minutes', claim_token = gen_random_uuid(), attempts = attempts + 1
      where q.bucket = job.bucket and q.path = job.path
      returning q.bucket, q.path, q.claim_token into bucket, path, claim_token;
    return next;
  end loop;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."claim_image_cleanup"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "private"."claim_image_cleanup"(integer) FROM PUBLIC;
