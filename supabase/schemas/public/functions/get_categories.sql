CREATE OR REPLACE FUNCTION public.get_categories()
  RETURNS TABLE (
    category text
  )
  LANGUAGE sql
  AS $function$
  select distinct category
  from products
  where category is not null
  order by category;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_categories"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_categories"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_categories"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_categories"() TO "postgres";
