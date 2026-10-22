-- ---------------------------------------------------------------------------
-- Страница «Рутина»: схема БД
--
-- СТАТУС: ПРИМЕНЕНО к проекту zgvolwclxwvboazhskio (shelf-life-guard,
-- West EU) 2026-10-22 через `supabase db query --linked -f <этот файл>`.
-- Проверено: 3 таблицы с включённым RLS и 4 политиками каждая, 17 ограничений
-- (включая FK user_id → auth.users(id)), 4 политики storage.objects, приватный
-- бакет routine-photos. `supabase db advisors --type all` по новым объектам
-- дал только INFO: unindexed_foreign_keys (user_id в routine_items/
-- routine_photos и copied_from в routines) и unused_index (ложное срабатывание
-- на новых пустых таблицах). WARN auth_rls_initplan новых таблиц НЕ коснулся —
-- он флагает products и product_tags, где auth.uid() не обёрнут в (select ...).
-- Типы перегенерированы: npm run types, дифф к database.types.ts чисто
-- аддитивный (+148 строк).
--
-- Файл оставлен как источник истины по схеме и как скрипт отката/повторного
-- применения (например, для нового окружения). В репозитории нет миграций
-- Supabase CLI, схема ведётся вручную.
--
-- Порядок применения с нуля:
--   1. Выполнить раздел 1 (таблицы).
--   2. Выполнить раздел 2 (RLS) — без него ничего не заработает: приложение
--      использует только anon/publishable ключ, service-role ключа в проекте нет.
--   2.1. Выполнить раздел 2.1 (GRANT). В этом проекте настроены default
--      privileges, поэтому гранты anon/authenticated/postgres/service_role
--      выдаются автоматически и раздел избыточен — но он страхует окружение,
--      где дефолтов нет (с 2026-04-28 новые таблицы в public не экспонируются
--      в Data API по умолчанию; без гранта приложение получит 42501).
--   3. Выполнить раздел 3 (Storage) — приватный бакет для фото лица.
--   4. Запустить `npm run types`, чтобы src/shared/model/database.types.ts
--      подхватил новые таблицы.
--
-- Как применить через CLI (проверенный способ, access-токен уже в CLI):
--   supabase db query --linked --project-ref zgvolwclxwvboazhskio -f supabase/routine-schema.sql
--
-- После применения прогнать `supabase db advisors --linked --type all`
-- и разобрать замечания.
--
-- Соглашения, сверенные с живой БД проекта (а не по сгенерированным типам):
--   * products.user_id ИМЕЕТ FK: `products_user_id_fkey FOREIGN KEY (user_id)
--     REFERENCES auth.users(id)`, без ON DELETE. Сгенерированные
--     database.types.ts этого не показывают (Relationships: []), поэтому
--     сверка обязательна. Здесь повторяем тот же FK без cascade.
--   * даты хранятся как date и передаются строками YYYY-MM-DD.
--   * дочерние таблицы денормализованно несут user_id, чтобы все политики
--     имели одинаковую форму и не требовали подзапросов к routines.
--
-- Намеренные отличия от products (в сторону усиления, по security-чек-листу):
--   * политики адресованы `to authenticated`, а не `{public}`;
--   * auth.uid() обёрнут в (select ...), иначе advisors ругается на
--     неиммутабельный вызов функции в предикате;
--   * UPDATE-политики имеют и USING, и WITH CHECK. У products UPDATE-политика
--     "Users can update own products" создана шаблоном дашборда и WITH CHECK
--     НЕ имеет — это позволяет залогиненному пользователю поменять user_id
--     у своей строки и фактически передать её другому аккаунту. Стоит
--     починить отдельно от этой задачи.
--   * грант в разделе 2.1 выдан только authenticated. Фактически в проекте
--     настроены default privileges, поэтому anon/postgres/service_role
--     получили полные права автоматически — как и у products. Безопасность
--     обеспечивает не грант, а RLS: политик для anon нет, значит
--     auth.uid() IS NULL и anon не видит и не может изменить ни одной строки.
--     Явный грант оставлен как страховка для окружения без дефолтов.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 1. Таблицы
-- ===========================================================================

-- Рутина: ограниченный датами курс ухода.
-- Пересечения дат между рутинами разрешены, статус не хранится —
-- выводится из start_date/end_date на клиенте (getRoutineStatus).
create table public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id),
  name        text,
  start_date  date not null,
  end_date    date,
  notes       text,
  -- provenance: из какой рутины создана копия. SET NULL, чтобы история
  -- оставалась валидной после удаления исходной рутины.
  copied_from uuid references public.routines(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint routines_dates_order check (end_date is null or end_date >= start_date)
);

create index routines_user_start_idx on public.routines (user_id, start_date desc);


-- Позиция рутины: ссылка на баночку из products.
-- Утро/вечер — одна колонка time_of_day (both = средство в единственном наборе).
-- Дни недели — 7 булевых колонок: их фильтрует обычный PostgREST, они читаемы
-- в Table Editor и позволяют CHECK-ом связать их с is_constant.
create table public.routine_items (
  id          uuid primary key default gen_random_uuid(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id),
  time_of_day text not null default 'both'
              constraint routine_items_time_of_day
              check (time_of_day in ('morning', 'evening', 'both')),
  is_constant boolean not null default true,
  mon         boolean not null default true,
  tue         boolean not null default true,
  wed         boolean not null default true,
  thu         boolean not null default true,
  fri         boolean not null default true,
  sat         boolean not null default true,
  sun         boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  -- одна баночка входит в рутину максимум один раз:
  -- «и утром, и вечером» выражается через time_of_day = 'both'
  constraint routine_items_unique_product unique (routine_id, product_id),
  -- явный флаг «постоянное» не должен разъезжаться с флагами дней
  constraint routine_items_constant_consistency
    check (is_constant = (mon and tue and wed and thu and fri and sat and sun))
);

create index routine_items_routine_idx on public.routine_items (routine_id, position);
create index routine_items_product_idx on public.routine_items (product_id);


-- Фото лица: две серии (начало/конец использования) по 7 фиксированных ракурсов.
-- Каждый слот необязателен; серия может состоять и из одного файла.
-- Коды series/slot обязаны совпадать со справочником
-- src/entities/routine/config/photo-slots.ts (держим в синхроне вручную).
create table public.routine_photos (
  id          uuid primary key default gen_random_uuid(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id),
  series      text not null
              constraint routine_photos_series check (series in ('start', 'end')),
  slot        text not null
              constraint routine_photos_slot
              check (slot in ('front', 'right', 'left', 'up', 'down', 'zone1', 'zone2')),
  image_path  text not null,
  created_at  timestamptz not null default now(),
  constraint routine_photos_unique_slot unique (routine_id, series, slot)
);

create index routine_photos_routine_idx on public.routine_photos (routine_id);


-- ===========================================================================
-- 2. Row Level Security
--
-- Для каждой таблицы нужны все 4 глагола. Нюансы:
--   * UPDATE-политика обязана иметь и USING, и WITH CHECK: без WITH CHECK
--     пользователь смог бы переназначить user_id и «подарить» строку другому.
--   * Без SELECT-политики UPDATE/DELETE молча затрагивают 0 строк.
--   * `to authenticated` + предикат владения; auth.role() не используется.
-- ===========================================================================

alter table public.routines      enable row level security;
alter table public.routine_items enable row level security;
alter table public.routine_photos enable row level security;

create policy "routines_select_own" on public.routines
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "routines_insert_own" on public.routines
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "routines_update_own" on public.routines
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "routines_delete_own" on public.routines
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "routine_items_select_own" on public.routine_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "routine_items_insert_own" on public.routine_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "routine_items_update_own" on public.routine_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "routine_items_delete_own" on public.routine_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "routine_photos_select_own" on public.routine_photos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "routine_photos_insert_own" on public.routine_photos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "routine_photos_update_own" on public.routine_photos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "routine_photos_delete_own" on public.routine_photos
  for delete to authenticated using ((select auth.uid()) = user_id);


-- ===========================================================================
-- 2.1. Гранты: без них таблицы недоступны через Data API
--
-- С 2026-04-28 (breaking change в changelog Supabase) новые таблицы в схеме
-- public БОЛЬШЕ НЕ экспонируются в Data и GraphQL API по умолчанию.
--
-- Два независимых слоя доступа:
--   * GRANT — может ли роль вообще обратиться к таблице через PostgREST;
--   * RLS   — какие именно строки она при этом видит.
-- Без гранта RLS не спасает: запрос вернёт ошибку 42501
-- "permission denied for table ..." с подсказкой, какой GRANT нужен.
--
-- Роль anon намеренно не получает доступ: приложение пускает к рутинам только
-- залогиненных (proxy.ts редиректит на /auth/login), поэтому достаточно
-- authenticated. service_role в проекте не используется.
-- ===========================================================================

grant select, insert, update, delete on table public.routines       to authenticated;
grant select, insert, update, delete on table public.routine_items  to authenticated;
grant select, insert, update, delete on table public.routine_photos to authenticated;


-- ===========================================================================
-- 3. Storage: приватный бакет для фото лица
--
-- Отдельный бакет, а не префикс внутри product-images: чистый жизненный цикл
-- и независимые политики. Путь объекта: {user.id}/{routine.id}/{uuid}.webp —
-- первый сегмент используется в политиках, префикс рутины позволяет чистить
-- файлы при удалении рутины (DB-cascade файлы в Storage не удаляет).
--
-- Нужны INSERT, SELECT и UPDATE: при отсутствии UPDATE-политики загрузка
-- с upsert молча не срабатывает.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('routine-photos', 'routine-photos', false)
on conflict (id) do nothing;

create policy "routine_photos_storage_read_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'routine-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "routine_photos_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'routine-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "routine_photos_storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'routine-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'routine-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "routine_photos_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'routine-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


-- ===========================================================================
-- 4. Ручная проверка после применения
-- ===========================================================================
--
-- a) Table Editor: таблицы routines / routine_items / routine_photos видны,
--    RLS включён (зелёный щит).
-- b) Гранты применились (см. раздел 2.1):
--      select table_name, grantee, privilege_type
--      from information_schema.role_table_grants
--      where table_schema = 'public'
--        and table_name in ('routines','routine_items','routine_photos')
--      order by table_name, grantee, privilege_type;
--    Для каждой из трёх таблиц ожидаются 4 строки с grantee = 'authenticated'.
--    Симптом отсутствия гранта — ошибка PostgREST 42501 "permission denied for
--    table ..." в ответе приложения, а не пустой список.
-- c) Под залогиненным пользователем выполнить в Data Explorer:
--      insert into public.routines (start_date) values (current_date) returning id;
--      select * from public.routines;
--      update public.routines set notes = 'test' where id = '<id>';
--      delete from public.routines where id = '<id>';
--    Все четыре должны succeed.
-- d) Проверить изоляцию: строка с чужим user_id не должна возвращаться select'ом.
-- e) Storage → Buckets: routine-photos существует и приватный (Public = off).
--
-- Откат (если понадобится):
--   drop table if exists public.routine_photos;
--   drop table if exists public.routine_items;
--   drop table if exists public.routines;
--   drop policy if exists "routine_photos_storage_read_own"   on storage.objects;
--   drop policy if exists "routine_photos_storage_insert_own" on storage.objects;
--   drop policy if exists "routine_photos_storage_update_own" on storage.objects;
--   drop policy if exists "routine_photos_storage_delete_own" on storage.objects;
--   delete from storage.buckets where id = 'routine-photos';
