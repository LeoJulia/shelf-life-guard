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
- **State Management**: Pinia
- **Icons**: Mage Icons

### Основные зависимости

```json
{
  "@nuxtjs/supabase": "^1.0.0",
  "@nuxt/ui": "^3.x",
  "nuxt": "^3.x",
  "tailwindcss": "^3.x",
  "vue": "^3.5.34",
  "vue-router": "^4.x",
  "pinia": "^2.x"
}
```

---

## Структура проекта

```
shelf-life-guard/
├── app/                    # Клиентская часть (client-side)
│   ├── components/        # Vue компоненты
│   │   ├── Filter.vue     # Компонент поиска и переключения режима отображения
│   │   ├── ProductCard.vue # Карточка продукта
│   │   ├── ProductForm.vue # Модальное окно редактирования продукта
│   │   ├── ProductList.vue # Список продуктов (сетка/список)
│   │   ├── ProductRow.vue # Строка с меткой и значением
│   │   ├── Statistic.vue  # Статистика
│   │   ├── SidebarFilter.vue # Боковая панель фильтров
│   │   └── ui/            # UI компоненты
│   │       ├── ProgressBar.vue # Прогресс-бар срока годности
│   │       ├── Rating.vue    # Рейтинг продукта (звёзды)
│   │       └── Tags.vue      # Теги продукта
│   ├── components/header/ # Шапка сайта
│   │   └── Header.vue     # Компонент хедера
│   ├── middleware/        # Глобальные мидлвары
│   │   └── redirect-to-product-list.global.ts
│   ├── pages/             # Страницы приложения
│   │   ├── dashboard.vue  # Главная страница (дашборд)
│   │   └── product/       # Маршрут для просмотра продукта
│   │       └── [id].vue   # Динамическая страница по ID продукта
│   ├── stores/            # Pinia сторы
│   │   ├── filterStore.ts  # Стор для фильтрации и поиска
│   │   └── productStore.ts # Стор для текущего продукта (редактирование)
│   └── app.vue            # Корневой компонент
├── assets/                # Статические ресурсы
│   └── css/              # CSS файлы
│       └── main.css      # Основной stylesheet
├── __mocks__/             # Моки для тестирования
│   └── product.json      # Пример данных продукта (JSON)
├── server/                # Серверная часть (server-side)
│   └── api/              # API эндпоинты
│       ├── filter.ts    # Эндпоинт /api/filter (получение опций фильтров)
│       ├── product-list.ts  # Эндпоинт /api/product-list
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
├── types/                 # TypeScript типы
│   └── database.types.ts  # Типы базы данных Supabase
└── tsconfig.json          # Конфигурация TypeScript
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
| `created_at`   | string \| null | Дата создания записи                | ISO timestamp           |

### База данных Supabase — RPC функции (`app/types/database.types.ts`)

| Функция           | Описание                        | Возврат                                      |
| ----------------- | ------------------------------- | -------------------------------------------- |
| `get_brands`      | Получение уникальных брендов    | `{ brand: string }[]`                        |
| `get_categories`  | Получение уникальных категорий  | `{ category: string }[]`                     |
| `get_shops`       | Получение уникальных магазинов  | `{ shop: string }[]`                         |
| `get_volumes`     | Получение уникальных объёмов    | `{ volume: string }[]`                       |
| `get_price_range` | Получение диапазона цен покупки | `{ min_price: number, max_price: number }[]` |

---

## API Эндпоинты

### GET /api/filter

**Описание**: Возвращает опции для фильтров (бренды, категории, магазины, объёмы, диапазон цен).

**Response**:

```json
{
  "brands": ["NEEDLY", "Brand B"],
  "categories": ["Очищение", "Уход за кожей"],
  "shops": ["82box", "Магазин 2"],
  "volumes": ["235мл", "100мл"],
  "priceRange": [1, 5000]
}
```

**File**: [`server/api/filter.ts`](../server/api/filter.ts)

---

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
  "volume": "235мл",
  "market_price": 1900.0,
  "actual_price": 972.99,
  "shop": "82box",
  "year": 2025,
  "opened_at": "2025-08-08",
  "expiry_date": "2026-05-13",
  "finished_at": null,
  "rating": 5,
  "ingredients": "ароматизатор, вода...",
  "notes": "Очень нравится"
}
```

**File**: [`server/api/product.ts`](../server/api/product.ts)

---

### GET /api/product-list

**Описание**: Возвращает список продуктов с возможностью фильтрации и поиска.

**Query Parameters**:

- `searchQuery` (string): Поиск по названию, бренду или категории
- `brands` (string[]): Фильтр по брендам
- `categories` (string[]): Фильтр по категориям
- `shops` (string[]): Фильтр по магазинам
- `minPrice` (number): Минимальная цена покупки
- `maxPrice` (number): Максимальная цена покупки
- `isOpenProducts` (boolean): Только открытые продукты (opened_at не null)
- `isCloseProducts` (boolean): Только закрытые продукты (opened_at null)
- `isFinishedProducts` (boolean): Только законченные продукты (finished_at не null)
- `isTermLessThan30Days` (boolean): Срок годности меньше 30 дней
- `isTermLessThan90Days` (boolean): Срок годности меньше 90 дней

**Response**:

```json
[
  {
    "id": "uuid-123",
    "name": "Mild cleansing gel",
    "brand": "NEEDLY",
    "category": "Очищение",
    ...
  },
  ...
]
```

**File**: [`server/api/product-list.ts`](../server/api/product-list.ts)

---

### GET /api/statistic

**Описание**: Возвращает статистические данные о продуктах.

**Response**:

```json
{
  "total": 10, // Общее количество продуктов
  "spentYear": 5, // Количество продуктов, открытых в текущем году
  "expiring30Days": 2, // Продуктов, срок годности которых истекает в ближайшие 60 дней
  "openedTotal": 7 // Всего открытых продуктов (есть opened_at)
}
```

**File**: [`server/api/statistic.ts`](../server/api/statistic.ts)

---

## Компоненты

### Filter.vue

Компонент для поиска и переключения режима отображения (сетка/список).

**Props**:

- `viewMode` (string): Текущий режим отображения ('grid' или 'list')
- `setViewMode`: Функция для смены режима отображения

**State (через filterStore)**:

- `searchQuery` (string): Запрос поиска

**Функциональность**:

- Поиск по названию, бренду или категории
- Кнопка "Фильтр" (открывает боковую панель фильтров)
- Кнопка "Сортировка" (заглушка)
- Переключение между сеточным и списочным видом

**File**: [`app/components/Filter.vue`](../app/components/Filter.vue)

---

### ProductList.vue

Компонент для отображения списка продуктов в виде карточек или списка.

**Props**:

- `data` (TProduct[]): Массив данных продуктов
- `setViewMode`: Функция для смены режима отображения

**File**: [`app/components/ProductList.vue`](../app/components/ProductList.vue)

---

### ProductCard.vue

Компонент карточки продукта.

**Props**:

- `product` (TProduct): Данные продукта

**Отображаемая информация**:

- Бренд и название продукта
- Рейтинг (звёзды через компонент Rating)
- Теги (категория, объём, год покупки)
- Прогресс-бар срока годности
- Дата открытия
- Магазин покупки
- Цена за день использования (расчётная стоимость)

**File**: [`app/components/ProductCard.vue`](../app/components/ProductCard.vue)

---

### ProductForm.vue

Модальное окно для редактирования продукта.

**Props**:

- `product` (TProduct): Данные продукта для редактирования

**Поля формы**:

- Бренд
- Название
- Срок годности

**File**: [`app/components/ProductForm.vue`](../app/components/ProductForm.vue)

---

### ProductRow.vue

Простой компонент для отображения строки с меткой и значением (для детальной страницы продукта).

**Props**:

- `field` (string): Название поля/метка
- `value`: Значение поля (может быть null, тогда отображается "-")

**File**: [`app/components/ProductRow.vue`](../app/components/ProductRow.vue)

---

### Statistic.vue

Компонент для отображения статистики продуктов.

**Функциональность**:

- Отображает 4 метрики:
  - Всего продуктов
  - Потрачено за год (продуктов, открытых в текущем году)
  - Открыто всего (всего открытых продуктов)
  - Скоро просрок (продуктов с истекающим сроком годности)

**File**: [`app/components/Statistic.vue`](../app/components/Statistic.vue)

---

### ProgressBar.vue

UI-компонент для отображения прогресса срока годности продукта.

**Props**:

- `product` (TProduct): Данные продукта

**Функциональность**:

- Отображает процент оставшегося срока годности
- Показывает дату истечения срока
- Визуальный индикатор с градиентом

**File**: [`app/components/ui/ProgressBar.vue`](../app/components/ui/ProgressBar.vue)

---

### Rating.vue

UI-компонент для отображения рейтинга продукта в виде звёзд.

**Props**:

- `rating` (number): Оценка от 1 до 5

**Функциональность**:

- Отображает заполненные звёзды для указанного рейтинга
- Пустые звёзды отображаются серым цветом

**File**: [`app/components/ui/Rating.vue`](../app/components/ui/Rating.vue)

---

### Tags.vue

UI-компонент для отображения тегов продукта.

**Props**:

- `product` (TProduct): Данные продукта

**Отображаемые теги**:

- Категория
- Объём
- Год покупки

**File**: [`app/components/ui/Tags.vue`](../app/components/ui/Tags.vue)

---

### SidebarFilter.vue

Боковая панель с фильтрами для продуктов.

**State (через filterStore)**:

- `showFilter`: Открыто ли боковое меню
- `filterBrand` (string[]): Выбранные бренды
- `filterCategory` (string[]): Выбранные категории
- `filterShop` (string[]): Выбранные магазины
- `priceRange` [number, number]: Диапазон цен покупки
- `isOpenProducts`: Фильтр открытых продуктов
- `isCloseProducts`: Фильтр закрытых продуктов
- `isFinishedProducts`: Фильтр законченных продуктов
- `isTermLessThan30Days`: Срок меньше 30 дней
- `isTermLessThan90Days`: Срок меньше 90 дней

**Функциональность**:

- Выбор брендов (множественный выбор)
- Выбор категорий (множественный выбор)
- Выбор магазинов (множественный выбор)
- Диапазон цен покупки (слайдер)
- Фильтры по статусу продукта:
  - Открытые баночки (opened_at не null)
  - Закрытые баночки (opened_at null)
  - Законченные баночки (finished_at не null)
- Фильтры по сроку годности:
  - Срок меньше 30 дней
  - Срок меньше 90 дней

**File**: [`app/components/SidebarFilter.vue`](../app/components/SidebarFilter.vue)

---

### Header.vue

Компонент шапки сайта.

**Функциональность**:

- Логотип и название приложения
- Навигация (заглушки): Главная, Продукты, Рутина, Аналитика
- Кнопка "Добавить" (заглушка)

**File**: [`app/components/header/Header.vue`](../app/components/header/Header.vue)

---

## Страницы

### /dashboard (Главная страница)

Основная страница приложения, отображающая статистику и список продуктов.

**Функциональность**:

- Отображает компонент Statistic с метриками
- Отображает список продуктов через ProductList
- Использует filterStore для поиска
- Боковая панель фильтров (SidebarFilter)

**File**: [`app/pages/dashboard.vue`](../app/pages/dashboard.vue)

---

### /product/[id] (Детальная страница продукта)

Страница просмотра информации о конкретном продукте.

**Функциональность**:

- Отображает все основные данные продукта
- Показывает рейтинг, теги и прогресс-бар срока годности
- Детальная информация через ProductRow:
  - Комментарий (notes)
  - Состав (ingredients)
  - Рыночная стоимость
  - Стоимость покупки
  - Магазин покупки
  - Дата начала использования
  - Дата окончания использования
- Редактирование продукта через ProductForm

**File**: [`app/pages/product/[id].vue`](../app/pages/product/[id].vue)

---

## Сторы (Pinia Stores)

### productStore.ts

Стор для хранения текущего редактируемого продукта.

**State**:

- `product`: Объект с данными продукта (brand, name, expiry_date и др.)

**Actions**:

- `setProduct(product: TProduct)`: Устанавливает данные продукта

**File**: [`app/stores/productStore.ts`](../app/stores/productStore.ts)

---

### filterStore.ts

Стор для управления состоянием фильтрации и поиска.

**State**:

- `showFilter` (boolean): Открыто ли боковое меню фильтров
- `searchQuery` (string): Запрос поиска
- `filterBrand` (string[]): Выбранные бренды
- `filterCategory` (string[]): Выбранные категории
- `filterShop` (string[]): Выбранные магазины
- `priceRange` [number, number]: Диапазон цен покупки
- `isOpenProducts` (boolean): Фильтр открытых продуктов
- `isCloseProducts` (boolean): Фильтр закрытых продуктов
- `isFinishedProducts` (boolean): Фильтр законченных продуктов
- `isTermLessThan30Days` (boolean): Срок меньше 30 дней
- `isTermLessThan90Days` (boolean): Срок меньше 90 дней
- `initialValues`: Объект с начальными значениями для фильтров

**Actions**:

- `setSearchQuery(query: string)`: Устанавливает запрос поиска
- `setInitialValues(values: any)`: Устанавливает начальные значения фильтров
- `setShowFilter(showFilter: boolean)`: Переключает видимость боковой панели
- `setIsCloseProducts(value: boolean)`: Устанавливает фильтр закрытых продуктов
- `setIsOpenProducts(value: boolean)`: Устанавливает фильтр открытых продуктов
- `setIsFinishedProducts(value: boolean)`: Устанавливает фильтр законченных продуктов
- `setIsTermLessThan90Days(value: boolean)`: Устанавливает фильтр срока меньше 90 дней
- `setIsTermLessThan30Days(value: boolean)`: Устанавливает фильтр срока меньше 30 дней
- `resetFilters()`: Сбрасывает все фильтры

**File**: [`app/stores/filterStore.ts`](../app/stores/filterStore.ts)

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
7. **Расчёт стоимости за день**: В компоненте ProductCard.vue рассчитывается стоимость продукта за день использования на основе даты открытия и фактической цены
8. **Прогресс-бар срока годности**: Рассчитывается как процент времени, прошедшего с момента покупки до истечения срока (90 дней)
9. **State management**: Pinia используется для управления состоянием фильтрации и поиска через filterStore
10. **Редактирование продукта**: Модальное окно ProductForm.vue позволяет редактировать бренд, название и срок годности продукта
