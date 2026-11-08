CREATE OR REPLACE FUNCTION public.get_price_range()
  RETURNS TABLE (
    min_price double precision,
    max_price double precision
  )
  LANGUAGE sql
  AS $function$
  select
    min(actual_price),
    max(actual_price)
  from products;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_price_range"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_price_range"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_price_range"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_price_range"() TO "postgres";
