-- Standalone deployment; requires the existing products schema and RLS.
-- Statistics aggregates computed in the database instead of fetching every
-- product into JS: a plain select would silently truncate at the Data API
-- max_rows limit (1000), under-counting totals once a user exceeds it.
begin;
set local lock_timeout = '5s';

-- SECURITY INVOKER: the aggregate runs under the caller's RLS, so only the
-- owner's products are counted. Granted to authenticated only.
--
-- Semantics mirror the pure helpers in entities/product/lib:
--   spent_year      -> isSpentInYear: products.year = p_year (year added)
--   expiring_30_days-> isExpiringSoon: expiry_date within [p_today, p_today+30]
--                      calendar days, not finished, expiry_date present
--   opened_total    -> opened_at present and not finished
-- p_year and p_today are passed from the server so the year boundary and
-- "today" match the JS calendar exactly, independent of the database timezone.
create or replace function public.get_product_statistics(p_year integer, p_today date)
returns table(total bigint, spent_year numeric, expiring_30_days bigint, opened_total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
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
$$;

revoke execute on function public.get_product_statistics(integer, date) from public, anon;
grant execute on function public.get_product_statistics(integer, date) to authenticated;

commit;