-- Self-contained: creates the function inside the transaction, exercises it on
-- synthetic data, then rolls everything back. No permanent change, no Storage.
-- Run: supabase db query --linked --project-ref <ref> -f supabase/product-statistics.test.sql
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Identical to supabase/product-statistics.sql so the test validates the real body.
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

create function pg_temp.ps_assert(p_ok boolean, p_message text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_ok is not true then raise exception 'ASSERTION FAILED: %', p_message; end if;
end;
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
  ('10000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', 'stat-owner-a@example.invalid', '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-0000000000c2', 'authenticated', 'authenticated', 'stat-owner-b@example.invalid', '{}'::jsonb, '{}'::jsonb),
  ('10000000-0000-4000-8000-0000000000c3', 'authenticated', 'authenticated', 'stat-owner-c@example.invalid', '{}'::jsonb, '{}'::jsonb);

-- Owner B: a product that must never leak into owner A's aggregates via RLS.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000c2', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
insert into public.products (id, user_id, brand, name, year, actual_price, expiry_date, opened_at)
values ('20000000-0000-4000-8000-0000000000f1', auth.uid(), 'Foreign', 'foreign cream', 2026, 10000, '2026-11-10', '2026-01-01');

-- Owner A: products covering every metric branch. Reference date 2026-11-08, year 2026.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000c1', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
insert into public.products (id, user_id, brand, name, year, actual_price, expiry_date, opened_at, finished_at) values
  -- today (inclusive), opened, not finished -> spent + expiring + opened
  ('20000000-0000-4000-8000-000000000001', auth.uid(), 'B', 'p1', 2026, 100.50, '2026-11-08', '2026-01-01', null),
  -- today+30 (inclusive), unopened -> spent + expiring
  ('20000000-0000-4000-8000-000000000002', auth.uid(), 'B', 'p2', 2026, 200.00, '2026-12-08', null, null),
  -- today+31 (excluded), null price, opened -> opened only
  ('20000000-0000-4000-8000-000000000003', auth.uid(), 'B', 'p3', 2026, null, '2026-12-09', '2026-02-01', null),
  -- yesterday + finished + other year -> none
  ('20000000-0000-4000-8000-000000000004', auth.uid(), 'B', 'p4', 2025, 500.00, '2026-11-07', '2025-01-01', '2026-01-01'),
  -- null expiry, unopened -> spent only
  ('20000000-0000-4000-8000-000000000005', auth.uid(), 'B', 'p5', 2026, 50.25, null, null, null),
  -- within window but finished -> spent only
  ('20000000-0000-4000-8000-000000000006', auth.uid(), 'B', 'p6', 2026, 10.00, '2026-11-20', '2026-03-01', '2026-10-01'),
  -- other year but within window, unopened -> expiring only
  ('20000000-0000-4000-8000-000000000007', auth.uid(), 'B', 'p7', 2025, 999.99, '2026-11-15', null, null);

do $test$
declare
  s record;
begin
  select * into s from public.get_product_statistics(2026, '2026-11-08');
  perform pg_temp.ps_assert(s.total = 7, 'total counts all own products');
  perform pg_temp.ps_assert(s.spent_year = 360.75, 'spent_year sums only year=2026 (null price as 0)');
  perform pg_temp.ps_assert(s.expiring_30_days = 3, 'expiring window inclusive today/+30, excludes finished/+31/yesterday/null');
  perform pg_temp.ps_assert(s.opened_total = 2, 'opened_total counts opened and not finished');

  -- Other owner's product must not leak through RLS.
  perform pg_temp.ps_assert(s.total = 7, 'foreign product not counted');
  perform pg_temp.ps_assert(s.spent_year = 360.75, 'foreign price not summed');
end;
$test$;

-- Empty user returns a single zero row (no products).
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000c3', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
do $test$
declare
  s record;
begin
  select * into s from public.get_product_statistics(2026, '2026-11-08');
  perform pg_temp.ps_assert(s.total = 0 and s.spent_year = 0 and s.expiring_30_days = 0 and s.opened_total = 0, 'empty user yields zeros');
end;
$test$;

-- anon must not be able to execute the statistics RPC.
reset role;
set local role anon;
select pg_temp.ps_expect_error('select * from public.get_product_statistics(2026, ''2026-11-08'')', '42501');
reset role;

rollback;