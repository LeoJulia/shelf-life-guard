-- Self-contained: creates the function inside the transaction, exercises it on
-- synthetic data, then rolls everything back. No permanent change, no Storage.
-- Run: supabase db query --linked --project-ref <ref> -f supabase/product-search.test.sql
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Identical to supabase/product-search.sql so the test validates the real body.
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

create function pg_temp.ps_assert(p_ok boolean, p_message text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_ok is not true then raise exception 'ASSERTION FAILED: %', p_message; end if;
end;
$$;

create function pg_temp.ps_ids(p_query text)
returns uuid[] language sql security invoker set search_path = '' as $$
  select coalesce(array_agg(id order by id), '{}') from public.search_product_ids(p_query);
$$;

create function pg_temp.ps_expect_error(p_sql text, p_state text)
returns void language plpgsql security invoker set search_path = '' as $$
declare failed boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_state then
      raise exception 'Expected SQLSTATE %, got % (%): %', p_state, sqlstate, sqlerrm, p_sql;
    end if;
    failed := true;
  end;
  if not failed then raise exception 'Expected SQLSTATE %, statement succeeded: %', p_state, p_sql; end if;
end;
$$;

-- Synthetic accounts; fixed UUIDs, no ON CONFLICT (collision fails loudly).
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'ps-owner-a@example.invalid', '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated', 'ps-owner-b@example.invalid', '{}'::jsonb, '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000a2', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
-- Other owner's product with a matching name must never leak through RLS.
insert into public.products (id, user_id, brand, name, year)
values ('20000000-0000-4000-8000-0000000000b1', auth.uid(), 'Foreign', 'cream,serum', 2026);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000a1', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

insert into public.products (id, user_id, brand, name, category, year) values
  ('20000000-0000-4000-8000-000000000001', auth.uid(), 'BrandA', 'cream,serum', 'care', 2026),
  ('20000000-0000-4000-8000-000000000002', auth.uid(), 'BrandB', '(test) mask', 'care', 2026),
  ('20000000-0000-4000-8000-000000000003', auth.uid(), 'BrandC', 'quote"test', null, 2026),
  ('20000000-0000-4000-8000-000000000004', auth.uid(), 'a.b brand', 'plain', null, 2026),
  ('20000000-0000-4000-8000-000000000005', auth.uid(), 'BrandE', '50% off', null, 2026),
  ('20000000-0000-4000-8000-000000000006', auth.uid(), 'BrandF', 'unrelated', 'special,category', 2026);

do $test$
declare
  comma uuid := '20000000-0000-4000-8000-000000000001';
  paren uuid := '20000000-0000-4000-8000-000000000002';
  quote uuid := '20000000-0000-4000-8000-000000000003';
  dot uuid := '20000000-0000-4000-8000-000000000004';
  pct uuid := '20000000-0000-4000-8000-000000000005';
  cat uuid := '20000000-0000-4000-8000-000000000006';
  foreign_b uuid := '20000000-0000-4000-8000-0000000000b1';
  ids uuid[];
begin
  -- Comma in the query is a literal, not a PostgREST separator.
  ids := pg_temp.ps_ids('cream,serum');
  perform pg_temp.ps_assert(ids = array[comma], 'comma query matches own product only');
  perform pg_temp.ps_assert(not (foreign_b = any(ids)), 'comma query never leaks other owner');

  -- Parentheses are literal.
  ids := pg_temp.ps_ids('(test)');
  perform pg_temp.ps_assert(ids = array[paren], 'parentheses query matches');

  -- Double quote is literal.
  ids := pg_temp.ps_ids('quote"test');
  perform pg_temp.ps_assert(ids = array[quote], 'double-quote query matches');

  -- Dot is literal (not a column/operator separator here).
  ids := pg_temp.ps_ids('a.b');
  perform pg_temp.ps_assert(ids = array[dot], 'dot query matches brand');

  -- Percent keeps ILIKE wildcard semantics without erroring.
  ids := pg_temp.ps_ids('50%');
  perform pg_temp.ps_assert(pct = any(ids), 'percent query matches');

  -- OR across name/brand/category.
  ids := pg_temp.ps_ids('special,category');
  perform pg_temp.ps_assert(ids = array[cat], 'category match with comma');

  -- Case-insensitive.
  ids := pg_temp.ps_ids('CREAM,SERUM');
  perform pg_temp.ps_assert(ids = array[comma], 'case-insensitive match');

  -- No match returns empty, not an error.
  ids := pg_temp.ps_ids('nonexistentxyz');
  perform pg_temp.ps_assert(ids = '{}', 'no match returns empty');

  -- NULL query returns empty without error.
  ids := pg_temp.ps_ids(null);
  perform pg_temp.ps_assert(ids = '{}', 'null query returns empty');

  -- A single quote in the query is literal too.
  insert into public.products (id, user_id, brand, name, year)
  values ('20000000-0000-4000-8000-000000000007', auth.uid(), 'BrandG', 'l''oreal', 2026);
  ids := pg_temp.ps_ids('l''oreal');
  perform pg_temp.ps_assert(ids = array['20000000-0000-4000-8000-000000000007'::uuid], 'single-quote query matches');
end;
$test$;

-- anon must not be able to execute the search RPC.
reset role;
set local role anon;
select pg_temp.ps_expect_error('select * from public.search_product_ids(''x'')', '42501');
reset role;

rollback;