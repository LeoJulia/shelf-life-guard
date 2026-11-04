-- ---------------------------------------------------------------------------
-- Каскады для удаления аккаунта (auth.admin.deleteUser) и удаления тега
--
-- СТАТУС: ПРИМЕНЕНО к проекту zgvolwclxwvboazhskio (shelf-life-guard,
-- West EU) 2026-11-04 через
-- `supabase db query --linked --project-ref zgvolwclxwvboazhskio -f <этот файл>`.
--
-- Проблема: FK `user_id -> auth.users(id)` у public-таблиц были без
-- ON DELETE CASCADE (confdeltype = 'a', NO ACTION), из-за чего
-- `auth.admin.deleteUser(uid)` падал с FK violation. У `tags` FK на
-- auth.users не было ВОВСЕ (user_id — просто uuid с default auth.uid()),
-- а `product_tags.tag_id -> tags(id)` был без каскада, из-за чего удаление
-- тега падал бы, пока тег привязан хоть к одному продукту.
--
-- Что сделано (по факту инспекции pg_constraint 2026-11-04):
--   * products_user_id_fkey, routines_user_id_fkey, routine_items_user_id_fkey,
--     routine_photos_user_id_fkey — пересозданы с ON DELETE CASCADE;
--   * tags_user_id_fkey — СОЗДАН (FK не существовал) с ON DELETE CASCADE;
--     сирот в tags до создания не было (проверено: 0 строк с user_id,
--     отсутствующим в auth.users);
--   * product_tags_tag_id_fkey — пересоздан с ON DELETE CASCADE
--     (product_tags_product_id_fkey уже был каскадным — не трогаем);
--   * routines_copied_from_fkey (ON DELETE SET NULL) — оставлен как есть;
--   * RLS delete-политика на tags («Enable delete for users based on
--     user_id») уже существует — не создаём.
--
-- Команда применения:
--   supabase db query --linked --project-ref zgvolwclxwvboazhskio -f supabase/account-delete-cascade.sql
--
-- Проверка после применения:
--   select conrelid::regclass, conname, confdeltype
--   from pg_constraint
--   where connamespace = 'public'::regnamespace and contype = 'f';
--   -- confdeltype = 'c' у всех *_user_id_fkey и product_tags_tag_id_fkey
--   supabase db advisors --type security
--
-- Откат (вернуть NO ACTION / удалить созданный FK):
--   alter table public.products drop constraint products_user_id_fkey;
--   alter table public.products add constraint products_user_id_fkey
--     foreign key (user_id) references auth.users(id);
--   alter table public.routines drop constraint routines_user_id_fkey;
--   alter table public.routines add constraint routines_user_id_fkey
--     foreign key (user_id) references auth.users(id);
--   alter table public.routine_items drop constraint routine_items_user_id_fkey;
--   alter table public.routine_items add constraint routine_items_user_id_fkey
--     foreign key (user_id) references auth.users(id);
--   alter table public.routine_photos drop constraint routine_photos_user_id_fkey;
--   alter table public.routine_photos add constraint routine_photos_user_id_fkey
--     foreign key (user_id) references auth.users(id);
--   alter table public.tags drop constraint tags_user_id_fkey;
--   alter table public.product_tags drop constraint product_tags_tag_id_fkey;
--   alter table public.product_tags add constraint product_tags_tag_id_fkey
--     foreign key (tag_id) references public.tags(id);
-- ---------------------------------------------------------------------------

alter table public.products
  drop constraint products_user_id_fkey,
  add constraint products_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.routines
  drop constraint routines_user_id_fkey,
  add constraint routines_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.routine_items
  drop constraint routine_items_user_id_fkey,
  add constraint routine_items_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.routine_photos
  drop constraint routine_photos_user_id_fkey,
  add constraint routine_photos_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- FK на auth.users у tags не существовал; сирот нет (проверено до применения)
alter table public.tags
  add constraint tags_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- удаление тега само чистит product_tags
alter table public.product_tags
  drop constraint product_tags_tag_id_fkey,
  add constraint product_tags_tag_id_fkey
    foreign key (tag_id) references public.tags(id) on delete cascade;
