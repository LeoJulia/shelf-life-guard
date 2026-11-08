CREATE OR REPLACE FUNCTION public.save_product_with_tags (
  p_product_id uuid  DEFAULT NULL::uuid,
  p_values     jsonb DEFAULT '{}'::jsonb,
  p_tags       jsonb DEFAULT '[]'::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_product_id uuid;
  v_tag_id uuid;
  v_tag record;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if pg_catalog.jsonb_typeof(p_values) is distinct from 'object' then
    raise exception 'Product values must be an object' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_tags) is distinct from 'array' then
    raise exception 'Tags must be an array' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_tags) as e(value)
    where pg_catalog.jsonb_typeof(e.value) is distinct from 'object'
       or pg_catalog.jsonb_typeof(e.value -> 'name') is distinct from 'string'
       or pg_catalog.jsonb_typeof(e.value -> 'color') is distinct from 'string'
       or pg_catalog.regexp_replace(e.value ->> 'name', '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
       or pg_catalog.regexp_replace(e.value ->> 'color', '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
  ) then
    raise exception 'Each tag needs a nonblank string name and color' using errcode = '22023';
  end if;

  if p_product_id is null then
    insert into public.products (
      user_id, brand, name, category, volume, market_price, actual_price,
      shop, rating, expiry_date, opened_at, finished_at, ingredients, notes,
      image_path, year
    ) values (
      v_user_id, coalesce(p_values ->> 'brand', ''), coalesce(p_values ->> 'name', ''),
      p_values ->> 'category', p_values ->> 'volume',
      nullif(p_values ->> 'market_price', '')::numeric,
      nullif(p_values ->> 'actual_price', '')::numeric,
      p_values ->> 'shop', nullif(p_values ->> 'rating', '')::numeric,
      nullif(p_values ->> 'expiry_date', '')::date,
      nullif(p_values ->> 'opened_at', '')::date,
      nullif(p_values ->> 'finished_at', '')::date,
      p_values ->> 'ingredients', p_values ->> 'notes', p_values ->> 'image_path',
      coalesce(nullif(p_values ->> 'year', '')::numeric, extract(year from current_date))
    ) returning id into v_product_id;
  else
    select p.id into v_product_id from public.products p
    where p.id = p_product_id and p.user_id = v_user_id
    for update;
    if not found then
      raise exception 'Product not found or inaccessible' using errcode = 'P0002';
    end if;

    update public.products p set
      brand = coalesce(p_values ->> 'brand', ''),
      name = coalesce(p_values ->> 'name', ''),
      category = p_values ->> 'category',
      volume = p_values ->> 'volume',
      market_price = nullif(p_values ->> 'market_price', '')::numeric,
      actual_price = nullif(p_values ->> 'actual_price', '')::numeric,
      shop = p_values ->> 'shop',
      rating = nullif(p_values ->> 'rating', '')::numeric,
      expiry_date = nullif(p_values ->> 'expiry_date', '')::date,
      opened_at = nullif(p_values ->> 'opened_at', '')::date,
      finished_at = nullif(p_values ->> 'finished_at', '')::date,
      ingredients = p_values ->> 'ingredients',
      notes = p_values ->> 'notes',
      image_path = case when p_values ? 'image_path' then p_values ->> 'image_path' else p.image_path end
    where p.id = v_product_id and p.user_id = v_user_id;
  end if;

  delete from public.product_tags where product_id = v_product_id;
  for v_tag in
    select distinct on (pg_catalog.lower(n.name)) n.name, n.color
    from pg_catalog.jsonb_array_elements(p_tags) with ordinality as e(value, ordinal)
    cross join lateral (
      select pg_catalog.regexp_replace(e.value ->> 'name', '^[[:space:]]+|[[:space:]]+$', '', 'g') as name,
             pg_catalog.regexp_replace(e.value ->> 'color', '^[[:space:]]+|[[:space:]]+$', '', 'g') as color
    ) n
    order by pg_catalog.lower(n.name), e.ordinal
  loop
    -- The no-op update locks and returns the conflict row even when another
    -- transaction just created it; DO NOTHING + SELECT has a snapshot race.
    insert into public.tags as existing (user_id, name, color)
    values (v_user_id, v_tag.name, v_tag.color)
    on conflict (user_id, (pg_catalog.lower(name)))
      do update set name = existing.name
    returning id into v_tag_id;

    insert into public.product_tags (product_id, tag_id)
    values (v_product_id, v_tag_id);
  end loop;
  return v_product_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."save_product_with_tags"(uuid, jsonb, jsonb) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."save_product_with_tags"(uuid, jsonb, jsonb) TO "service_role";

REVOKE ALL ON FUNCTION "public"."save_product_with_tags"(uuid, jsonb, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."save_product_with_tags"(uuid, jsonb, jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "public"."save_product_with_tags"(uuid, jsonb, jsonb) FROM PUBLIC, "anon";
