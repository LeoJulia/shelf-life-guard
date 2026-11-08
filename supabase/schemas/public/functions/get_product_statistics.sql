CREATE OR REPLACE FUNCTION public.get_product_statistics (
  p_year  integer,
  p_today date
)
  RETURNS TABLE (
    total            bigint,
    spent_year       numeric,
    expiring_30_days bigint,
    opened_total     bigint
  )
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select
    count(*)::bigint,
    coalesce(sum(p.actual_price::numeric) filter (where p.year = p_year), 0),
    count(*) filter (
      where p.expiry_date is not null
        and p.finished_at is null
        and p.expiry_date >= p_today
        and p.expiry_date <= p_today + 30
    )::bigint,
    count(*) filter (
      where p.opened_at is not null and p.finished_at is null
    )::bigint
  from public.products p;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_product_statistics"(integer, date) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_product_statistics"(integer, date) TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_product_statistics"(integer, date) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_product_statistics"(integer, date) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_product_statistics"(integer, date) FROM PUBLIC, "anon";
