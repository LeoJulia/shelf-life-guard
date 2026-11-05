-- ---------------------------------------------------------------------------
-- Уникальность имени тега — в пределах пользователя, а не всей таблицы
--
-- СТАТУС: применено к проекту zgvolwclxwvboazhskio (shelf-life-guard, West EU)
-- 2026-11-05 через
--   supabase db query --linked --project-ref zgvolwclxwvboazhskio -f supabase/tags-name-per-user-unique.sql
--
-- Проблема: на public.tags висел constrейнт `tags_name_key UNIQUE (name)` —
-- имя тега было уникальным для всех пользователей сразу. Теги в приложении
-- личные (SELECT-политика «Users can get own tags» отдаёт только свои строки,
-- все запросы фильтруют по user_id), поэтому у второго пользователя тег с
-- таким же именем создать нельзя, хотя он его не видит. Репорт:
-- xinata.2011@yandex.ru не могла добавить «Отдала» — строка с таким именем
-- уже принадлежала
-- mornemira@yandex.ru (id d9b4cdff-574b-4561-b935-6573068a5e17), Postgres
-- отвечал `duplicate key value violates unique constraint "tags_name_key"`.
--
-- Что сделано:
--   * constrейнт `tags_name_key` удалён (вместе с индексом);
--   * создан уникальный индекс `tags_name_per_user_key` по (user_id, lower(name)).
--     lower() — чтобы БД совпадала с дедупликацией приложения: и createTag
--     (src/pages/profile/api/create-tag.ts), и syncProductTags
--     (src/entities/tag/api/sync-product-tags.ts) сравнивают имена
--     регистронезависимо. Уникальный индекс по выражению — индекс, а не
--     constrейнт: в Postgres UNIQUE-constrейнт не поддерживает выражения.
--
-- Проверено до применения:
--   * дублей (user_id, lower(name)) в данных нет (group by ... having count>1
--     вернул 0 строк) — индекс создаётся без чистки данных;
--   * строк tags с user_id IS NULL нет (0), поэтому NULL-политика индекса
--     (NULLS DISTINCT) ни на что не влияет;
--   * на tags_name_key нет внешних ссылок: product_tags.tag_id ссылается на
--     tags(id), account-delete-cascade.sql пересоздавал tags_user_id_fkey.
--
-- Код приложения не менялся: он и так считает теги личными. Запросы вида
-- `.in("name", tagNames)` без user_id (src/entities/product/api/product-list.ts)
-- остаются безопасными — SELECT-политика отсекает чужие строки, а после этого
-- исправления одно имя легально может соответствовать id разных
-- пользователей, так что опора на RLS в них обязательна.
-- ---------------------------------------------------------------------------

begin;

alter table public.tags
  drop constraint if exists tags_name_key;

create unique index if not exists tags_name_per_user_key
  on public.tags (user_id, lower(name));

commit;

-- Самопроверка: те же имена теперь допускаются у разных владельцев
-- и по-прежнему запрещены внутри одного пользователя.
--   begin;
--   insert into public.tags (name, user_id)
--     values ('Отдала', 'c33ebc7d-07ad-4f91-816d-32d543a1d39b');
--   rollback;
