CREATE OR REPLACE FUNCTION private.guard_account_write()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare owner_id uuid;
begin
  if tg_table_name = 'product_tags' then
    select user_id into owner_id from public.products where id = new.product_id;
  else
    owner_id := new.user_id;
  end if;
  perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended(owner_id::text, 741));
  if exists (select 1 from private.account_deletions where user_id = owner_id) then
    if tg_table_name = 'routines' and tg_op = 'UPDATE' then
      if new.copied_from is null and old.copied_from is not null
         and (to_jsonb(new) - 'copied_from') = (to_jsonb(old) - 'copied_from') then
        return new;
      end if;
    end if;
    raise exception 'Account deletion is in progress' using errcode = '55000';
  end if;
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "private"."guard_account_write"() FROM PUBLIC;
