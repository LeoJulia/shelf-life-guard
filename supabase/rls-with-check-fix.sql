-- ---------------------------------------------------------------------------
-- RLS: WITH CHECK для products, tags и product_tags + приватный SELECT тегов
--
-- СТАТУС: ПРИМЕНЕНО к проекту zgvolwclxwvboazhskio (shelf-life-guard,
-- West EU) 2026-10-22 через `supabase db query --linked -f <этот файл>`.
-- Раздел 2 (SELECT у tags) применён отдельно тем же способом в тот же день.
--
-- Проблема: UPDATE-политики не имели WITH CHECK. В Postgres USING проверяет
-- строку ДО изменения, а WITH CHECK — ПОСЛЕ, поэтому без него аутентифицированный
-- пользователь мог переназначить `user_id` (у products/tags) или `product_id`
-- (у product_tags) на чужой и тем самым «передать»/подкинуть данные другому
-- владельцу. Плюс политики использовали голый `auth.uid()`, из-за чего
-- `supabase db advisors --type security` выдавал WARN auth_rls_initplan
-- (initplan на каждую строку вместо однократного вычисления).
--
-- Что сделано (раздел 1; имена политик и роли сохранены, семантика доступа
-- для владельца не изменилась):
--   * public.products   «Users can update own products»     — добавлен WITH CHECK
--   * public.tags       «Policy with table joins»           — добавлен WITH CHECK
--   * public.product_tags «Users can access own product tags» (FOR ALL) —
--     добавлен WITH CHECK через EXISTS к products (в таблице нет user_id,
--     владелец определяется через продукт)
--   * во всех трёх `auth.uid()` обёрнут в `(select auth.uid())`
--
-- Что сделано (раздел 2): политика «Users can get own tags» на public.tags
-- имела `qual = true`, то есть SELECT был открыт на ВСЕ теги ВСЕХ
-- пользователей. Теги в приложении личные (все запросы в коде уже фильтруют
-- `.eq("user_id", user.id)`: get-tags.ts, sync-product-tags.ts, get-filter.ts),
-- поэтому политика заменена на `(select auth.uid()) = user_id`.
-- Исключение — `product-list.ts:163` (`.in("name", tagNames)` без user_id),
-- но теперь чужие id туда попасть не могут: PostgREST вернёт только свои теги.
--
-- Проверено после применения:
--   * pg_policies: у всех трёх политик раздела 1 with_check заполнен,
--     у SELECT-политики tags qual = `(SELECT auth.uid()) = user_id`;
--   * `supabase db advisors --type security`: предупреждения auth_rls_initplan
--     и замечаний по политикам нет (остались не связанные с RLS
--     function_search_path_mutable для get_brands/get_categories/get_shops/
--     get_volumes и auth_leaked_password_protection);
--   * сквозной тест в приложении: продукт отредактирован (имя) и к нему привязан
--     новый тег — UPDATE products и INSERT/DELETE product_tags работают;
--     фильтр `/products?tag=...` отдаёт свои 6 продуктов с чипами тега,
--     подсказки тегов в форме продукта загружаются. Тестовые данные удалены.
--
-- Откат (вернуть политики к исходному виду):
--   drop policy "Users can update own products" on public.products;
--   create policy "Users can update own products" on public.products
--     for update using (auth.uid() = user_id);
--   drop policy "Policy with table joins" on public.tags;
--   create policy "Policy with table joins" on public.tags
--     for update using (auth.uid() = user_id);
--   drop policy "Users can get own tags" on public.tags;
--   create policy "Users can get own tags" on public.tags
--     for select using (true);
--   drop policy "Users can access own product tags" on public.product_tags;
--   create policy "Users can access own product tags" on public.product_tags
--     for all using (exists (
--       select 1 from products where products.id = product_tags.product_id
--         and products.user_id = auth.uid()));
--
-- Применение: supabase db query --linked --project-ref zgvolwclxwvboazhskio -f supabase/rls-with-check-fix.sql
-- ---------------------------------------------------------------------------

-- 1. WITH CHECK: нельзя переназначить владельца строки -----------------------

begin;

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products" on public.products
  for update to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Policy with table joins" on public.tags;
create policy "Policy with table joins" on public.tags
  for update to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can access own product tags" on public.product_tags;
create policy "Users can access own product tags" on public.product_tags
  for all to public
  using (exists (
    select 1 from public.products p
    where p.id = product_tags.product_id
      and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_tags.product_id
      and p.user_id = (select auth.uid())
  ));

commit;

-- 2. Теги приватные: SELECT только своих -------------------------------------

begin;

drop policy if exists "Users can get own tags" on public.tags;
create policy "Users can get own tags" on public.tags
  for select to public
  using ((select auth.uid()) = user_id);

commit;
