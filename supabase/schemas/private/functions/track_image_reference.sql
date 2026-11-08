CREATE OR REPLACE FUNCTION private.track_image_reference()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  image_bucket text := case when tg_table_name = 'products' then 'product-images' else 'routine-photos' end;
  old_path text;
  new_path text;
  image_owner uuid;
  current_state text;
  upload_deadline timestamptz;
begin
  if tg_op <> 'INSERT' then old_path := old.image_path; end if;
  if tg_op <> 'DELETE' then new_path := new.image_path; end if;
  if old_path is not distinct from new_path then return null; end if;

  if new_path is not null then
    image_owner := new.user_id;
    if split_part(new_path, '/', 1) <> image_owner::text then
      raise exception 'Image belongs to another account' using errcode = '42501';
    end if;
    insert into private.image_lifecycle(bucket, path, user_id, state)
    values (image_bucket, new_path, image_owner, 'attached') on conflict do nothing;
    select state, ready_at into current_state, upload_deadline
      from private.image_lifecycle where bucket = image_bucket and path = new_path for update;
    if current_state not in ('uploading', 'attached') or
       (current_state = 'uploading' and upload_deadline <= now()) then
      raise exception 'Image upload has expired or is being deleted' using errcode = '55000';
    end if;
    update private.image_lifecycle set state = 'attached', upload_settled = true, last_error = null
      where bucket = image_bucket and path = new_path;
  end if;

  if old_path is not null and split_part(old_path, '/', 1) = old.user_id::text then
    insert into private.image_lifecycle(bucket, path, user_id, state)
    values (image_bucket, old_path, old.user_id, 'attached') on conflict do nothing;
    perform 1 from private.image_lifecycle
      where bucket = image_bucket and path = old_path and user_id = old.user_id for update;
    if not found then return null; end if;
    if not exists (select 1 from public.products where image_bucket = 'product-images' and image_path = old_path)
       and not exists (select 1 from public.routine_photos where image_bucket = 'routine-photos' and image_path = old_path) then
      update private.image_lifecycle set state = 'pending', ready_at = now(), claim_token = null
        where bucket = image_bucket and path = old_path;
    end if;
  end if;
  return null;
end;
$function$;

REVOKE ALL ON FUNCTION "private"."track_image_reference"() FROM PUBLIC;
