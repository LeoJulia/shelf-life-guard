CREATE OR REPLACE FUNCTION public.get_volumes()
  RETURNS TABLE (
    volume text
  )
  LANGUAGE sql
  AS $function$
  select distinct volume
  from products
  where volume is not null
  order by volume;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_volumes"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_volumes"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_volumes"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_volumes"() TO "postgres";
