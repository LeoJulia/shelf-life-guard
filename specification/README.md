# Shelf-Life Guard - Спецификация проекта

## Описание проекта

**Shelf-Life Guard** — это веб-приложение на Nuxt 4 (Vue 3) для отслеживания косметических и бытовых продуктов с учётом срока годности, стоимости использования и оценки удовлетворённости.

---

## Технологический стек

### Frontend

- **Framework**: Nuxt 4.4.6 (SSR/SPA)
- **UI Library**: @nuxt/ui v4.8.1
- **CSS**: Tailwind CSS v4.3.0
- **JavaScript**: ES Modules (type: "module")

### Основные зависимости

```json
{
  "@nuxt/ui": "^4.8.1",
  "nuxt": "^4.4.6",
  "tailwindcss": "^4.3.0",
  "vue": "^3.5.34",
  "vue-router": "^5.0.7"
}
```

---

## Структура проекта

```
shelf-life-guard/
├── app/                    # Клиентская часть (client-side)
│   ├── components/        # Vue компоненты
│   │   └── ProductRow.vue # Компонент для отображения строки продукта
│   ├── pages/             # Страницы приложения
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
│       └── product.ts    # Эндпоинт /api/product
├── public/                # Статические файлы для публичного доступа
│   ├── favicon.ico        # Иконка сайта
│   └── robots.txt         # Файл для SEO-роботов
├── nuxt.config.ts         # Конфигурация Nuxt
├── package.json           # Зависимости и скрипты
└── specification/         # Документация проекта
    └── README.md          # Эта спецификация
```

---

## Структура данных продукта (Product Schema)

### JSON-структура (`__mocks__/product.json`)

| Поле                   | Тип            | Описание                                     | Пример                                     |
| ---------------------- | -------------- | -------------------------------------------- | ------------------------------------------ |
| `brand`                | string         | Бренд продукта                               | "NEEDLY"                                   |
| `productName`          | string         | Название продукта                            | "Mild cleansing gel"                       |
| `productType`          | string         | Тип/категория продукта                       | "Очищение"                                 |
| `expiryDate`           | string \| null | Дата истечения срока годности                | null                                       |
| `ingredients`          | string \| null | Состав продукта (текстовый список)           | "ароматизатор, 1,2-диол..."                |
| `volume`               | string         | Объём продукта                               | "235мл"                                    |
| `marketPrice`          | object         | Рыночная цена                                | `{ value: 1900.00, currency: "₽" }`        |
| `actualPrice`          | object         | Фактическая цена покупки                     | `{ value: 972.99, currency: "₽" }`         |
| `marketPricePerUnit`   | object \| null | Рыночная цена за единицу                     | null                                       |
| `actualPricePerUnit`   | object \| null | Фактическая цена за единицу                  | null                                       |
| `shop`                 | string         | Магазин покупки                              | "82box"                                    |
| `startDate`            | string         | Дата начала использования (YYYY-MM-DD)       | "2025-08-08"                               |
| `endDate`              | string         | Дата окончания использования/истечения срока | "2026-05-13"                               |
| `usageDurationDays`    | number         | Длительность использования в днях            | 278                                        |
| `marketPricePerDay`    | object         | Расчётная рыночная цена за день              | `{ value: 6.83, currency: "₽" }`           |
| `marketPriceFor30Days` | object         | Рыночная стоимость на 30 дней                | `{ value: 205.04, currency: "₽" }`         |
| `actualPricePerDay`    | object         | Фактическая цена за день использования       | `{ value: 3.50, currency: "₽" }`           |
| `actualPriceFor30Days` | object         | Фактическая стоимость на 30 дней             | `{ value: 105.00, currency: "₽" }`         |
| `rating`               | number         | Оценка продукта (1-5)                        | 5                                          |
| `comment`              | string \| null | Комментарий пользователя                     | "Очень нравится легкое ощущение при мытье" |
| `purchaseYear`         | string         | Год покупки                                  | "2025"                                     |

---

## API Эндпоинты

### GET /api/product

**Описание**: Возвращает данные о продукте.

**Response**:

```json
{
  "brand": "NEEDLY",
  "productName": "Mild cleansing gel",
  ...
}
```

**File**: [`server/api/product.ts`](../server/api/product.ts)

---

## Компоненты

### ProductRow.vue

Простой компонент для отображения строки с меткой и значением.

**Props**:

- `field` (string): Название поля/метка
- `value`: Значение поля (может быть null, тогда отображается "-")

**File**: [`app/components/ProductRow.vue`](../app/components/ProductRow.vue)

---

## Страницы

### /product/[id]

Страница просмотра информации о продукте. Отображает все основные данные продукта через компонент ProductRow.

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
4. **Цены**: Все цены хранятся в объектах с полями `value` (число) и `currency` (строка валюты)
