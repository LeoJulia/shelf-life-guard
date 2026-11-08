CREATE OR REPLACE FUNCTION public.get_brands()
  RETURNS TABLE (
    brand text
  )
  LANGUAGE sql
  AS $function$
  select distinct brand
  from products
  where brand is not null
  order by brand;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_brands"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_brands"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_brands"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_brands"() TO "postgres";
