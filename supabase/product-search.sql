-- Standalone deployment; requires the existing products schema and RLS.
-- Safe text search: the query is a bound parameter, so commas, parentheses,
-- quotes and other PostgREST reserved characters cannot break the filter.
begin;
set local lock_timeout = '5s';

-- SECURITY INVOKER: the SELECT runs under the caller's RLS, so only the owner's
-- products are searched. Granted to authenticated only (no service_role bypass).
create or replace function public.search_product_ids(p_query text)
returns table(id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id
  from public.products p
  where p.name ilike '%' || p_query || '%'
     or p.brand ilike '%' || p_query || '%'
     or p.category ilike '%' || p_query || '%'
$$;

revoke execute on function public.search_product_ids(text) from public, anon;
grant execute on function public.search_product_ids(text) to authenticated;

commit;