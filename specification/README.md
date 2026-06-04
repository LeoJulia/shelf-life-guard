# Shelf-Life Guard - Спецификация проекта

## Описание проекта

**Shelf-Life Guard** — это веб-приложение на Nuxt 3 (Vue 3) для отслеживания косметических и бытовых продуктов с учётом срока годности, стоимости использования и оценки удовлетворённости.

---

## Технологический стек

### Frontend

- **Framework**: Nuxt 3.x (SSR/SPA)
- **UI Library**: @nuxt/ui
- **CSS**: Tailwind CSS
- **JavaScript**: ES Modules (type: "module")

### Основные зависимости

```json
{
  "@nuxtjs/supabase": "^1.0.0",
  "@nuxt/ui": "^3.x",
  "nuxt": "^3.x",
  "tailwindcss": "^3.x",
  "vue": "^3.5.34",
  "vue-router": "^4.x"
}
```

---

## Структура проекта

```
shelf-life-guard/
├── app/                    # Клиентская часть (client-side)
│   ├── components/        # Vue компоненты
│   │   ├── Filter.vue     # Компонент фильтрации и поиска
│   │   ├── ProductCard.vue # Карточка продукта
│   │   ├── ProductList.vue # Список продуктов
│   │   └── Statistic.vue  # Статистика
│   ├── components/header/ # Шапка сайта
│   │   └── Header.vue     # Компонент хедера
│   ├── middleware/        # Глобальные мидлвары
│   │   └── redirect-to-product-list.global.ts
│   ├── pages/             # Страницы приложения
│   │   ├── dashboard.vue  # Главная страница (дашборд)
│   │   └── product/       # Маршрут для просмотра продукта
│   │       └── [id].vue   # Динамическая страница по ID продукта
│   └── app.vue            # Корневой компонент
├── assets/                # Статические ресурсы
│   └── css/              # CSS файлы
│       └── main.css      # Основной stylesheet
├── __mocks__/             # Моки для тестирования
│   └── product.json      # Пример данных продукта (JSON)
├── server/                # Серверная часть (server-side)
│   └── api/              # API эндпоинты
│       ├── product-list.ts    # Эндпоинт /api/product-list
│       ├── product.ts         # Эндпоинт /api/product
│       └── statistic.ts       # Эндпоинт /api/statistic
├── public/                # Статические файлы для публичного доступа
│   ├── favicon.ico        # Иконка сайта
│   └── robots.txt         # Файл для SEO-роботов
├── specification/         # Документация проекта
│   └── README.md          # Эта спецификация
├── supabase/              # Конфигурация Supabase
├── nuxt.config.ts         # Конфигурация Nuxt
├── package.json           # Зависимости и скрипты
└── types/                 # TypeScript типы
    └── database.types.ts  # Типы базы данных Supabase
```

---

## Структура данных продукта (Product Schema)

### База данных Supabase (`app/types/database.types.ts`)

Таблица `products` в Supabase содержит следующие поля:

| Поле           | Тип            | Описание                            | Пример                  |
| -------------- | -------------- | ----------------------------------- | ----------------------- |
| `id`           | string         | Уникальный идентификатор продукта   | "uuid-123"              |
| `name`         | string         | Название продукта                   | "Mild cleansing gel"    |
| `brand`        | string \| null | Бренд продукта                      | "NEEDLY"                |
| `category`     | string \| null | Категория/тип продукта              | "Очищение"              |
| `volume`       | string \| null | Объём продукта                      | "235мл"                 |
| `market_price` | number \| null | Рыночная цена (без валюты)          | 1900.0                  |
| `actual_price` | number \| null | Фактическая цена покупки            | 972.99                  |
| `shop`         | string \| null | Магазин покупки                     | "82box"                 |
| `year`         | number \| null | Год покупки                         | 2025                    |
| `opened_at`    | string \| null | Дата открытия продукта (YYYY-MM-DD) | "2025-08-08"            |
| `expiry_date`  | string \| null | Дата истечения срока годности       | "2026-05-13"            |
| `finished_at`  | string \| null | Дата окончания использования        |                         |
| `rating`       | number \| null | Оценка продукта (1-5)               | 5                       |
| `ingredients`  | string \| null | Состав продукта (текстовый список)  | "ароматизатор, вода..." |
| `notes`        | string \| null | Дополнительные заметки              | "Очень нравится"        |

---

## API Эндпоинты

### GET /api/product

**Описание**: Возвращает данные о конкретном продукте по ID.

**Query Parameters**:

- `id` (string): Уникальный идентификатор продукта

**Response**:

```json
{
  "id": "uuid-123",
  "name": "Mild cleansing gel",
  "brand": "NEEDLY",
  "category": "Очищение",
  ...
}
```

**File**: [`server/api/product.ts`](../server/api/product.ts)

---

### GET /api/product-list

**Описание**: Возвращает список продуктов с возможностью фильтрации и поиска.

**Query Parameters**:

- `search` (string): Поиск по названию, бренду или категории
- `shop` (string): Фильтр по магазину

**Response**:

```json
[
  {
    "id": "uuid-123",
    "name": "Mild cleansing gel",
    "brand": "NEEDLY",
    ...
  },
  ...
]
```

**File**: [`server/api/product-list.ts`](../server/api/product-list.ts)

---

### GET /api/statistic

**Описание**: Возвращает статистические данные о продуктах.

**File**: [`server/api/statistic.ts`](../server/api/statistic.ts)

---

## Компоненты

### Filter.vue

Компонент для поиска и фильтрации продуктов, а также переключения режима отображения (сетка/список).

**Props**:

- `viewMode` (string): Текущий режим отображения ('grid' или 'list')
- `setViewMode` (Function): Функция для смены режима отображения
- `setSearch` (Function): Функция для обработки поиска

**Функциональность**:

- Поиск по названию, бренду или категории
- Кнопка "Фильтр" (заглушка)
- Кнопка "Сортировка" (заглушка)
- Переключение между сеточным и списочным видом

**File**: [`app/components/Filter.vue`](../app/components/Filter.vue)

---

### ProductList.vue

Компонент для отображения списка продуктов в виде карточек или списка.

**Props**:

- `data` (TProduct[]): Массив данных продуктов
- `setSearch` (Function): Функция для обработки поиска

**File**: [`app/components/ProductList.vue`](../app/components/ProductList.vue)

---

### ProductCard.vue

Компонент карточки продукта.

**File**: [`app/components/ProductCard.vue`](../app/components/ProductCard.vue)

---

### Statistic.vue

Компонент для отображения статистики продуктов.

**File**: [`app/components/Statistic.vue`](../app/components/Statistic.vue)

---

### ProductRow.vue

Простой компонент для отображения строки с меткой и значением (для детальной страницы продукта).

**Props**:

- `field` (string): Название поля/метка
- `value`: Значение поля (может быть null, тогда отображается "-")

**File**: [`app/components/ProductRow.vue`](../app/components/ProductRow.vue)

---

### Header.vue

Компонент шапки сайта.

**File**: [`app/components/header/Header.vue`](../app/components/header/Header.vue)

---

## Страницы

### /dashboard (Главная страница)

Основная страница приложения, отображающая статистику и список продуктов.

**File**: [`app/pages/dashboard.vue`](../app/pages/dashboard.vue)

---

### /product/[id]

Страница просмотра информации о конкретном продукте. Отображает все основные данные продукта через компонент ProductRow.

**File**: [`app/pages/product/[id].vue`](../app/pages/product/[id].vue)

---

## Конфигурация

### Nuxt Config ([`nuxt.config.ts`](../nuxt.config.ts))

```typescript
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  telemetry: false,
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
});
```

---

## Скрипты (package.json)

| Команда         | Описание                        |
| --------------- | ------------------------------- |
| `yarn dev`      | Запуск разработки               |
| `yarn build`    | Сборка production               |
| `yarn generate` | Статическая генерация           |
| `yarn preview`  | Просмотр сгенерированного сайта |

---

## Примечания для разработчика

1. **CSS файл**: `assets/css/main.css` должен содержать базовые стили (Tailwind CSS подключается автоматически через @nuxt/ui)
2. **Моки данных**: Файл `__mocks__/product.json` используется как mock-данные для API и тестирования
3. **Оценка**: Поле `rating` хранится как числовое значение (1-5), отображается в виде звёзд через шаблонизатор Vue
4. **Цены**: Поля `market_price` и `actual_price` хранятся как числа без валюты (валюта определяется контекстом)
5. **База данных**: Используется Supabase для хранения данных о продуктах
6. **Типы TypeScript**: Типы генерируются из схемы Supabase в файле `types/database.types.ts`
