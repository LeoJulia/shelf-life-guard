CREATE OR REPLACE FUNCTION public.search_product_ids (
  p_query text
)
  RETURNS TABLE (
    id uuid
  )
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select p.id
  from public.products p
  where p.name ilike '%' || p_query || '%'
     or p.brand ilike '%' || p_query || '%'
     or p.category ilike '%' || p_query || '%'
$function$;

GRANT EXECUTE ON FUNCTION "public"."search_product_ids"(text) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."search_product_ids"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."search_product_ids"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."search_product_ids"(text) TO "postgres";

REVOKE ALL ON FUNCTION "public"."search_product_ids"(text) FROM PUBLIC, "anon";
