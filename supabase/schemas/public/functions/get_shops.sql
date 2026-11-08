CREATE OR REPLACE FUNCTION public.get_shops()
  RETURNS TABLE (
    shop text
  )
  LANGUAGE sql
  AS $function$
  select distinct shop
  from products
  where shop is not null
  order by shop;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_shops"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_shops"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_shops"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_shops"() TO "postgres";
