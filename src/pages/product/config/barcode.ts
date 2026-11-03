/**
 * Источники поиска по штрих-коду, по порядку. Базы Open Beauty Facts и
 * Open Food Facts частично пересекаются: косметика может лежать в любой из них
 * (на сайте OBF такие коды редиректят на OFF), поэтому пробуем обе.
 */
export const LOOKUP_BASE_URLS = [
  "https://world.openbeautyfacts.org",
  "https://world.openfoodfacts.org",
];

/**
 * Поля, которые запрашиваем, чтобы не тянуть весь объект продукта.
 * `product_name_ru` — локализованное название, если сообщество его заполнило.
 */
export const LOOKUP_FIELDS = [
  "code",
  "product_name",
  "product_name_ru",
  "brands",
  "quantity",
  "ingredients_text",
  "inci_name",
  "categories",
  "image_url",
].join(",");

/** Форматы штрих-кодов, которые распознаём (косметика — это почти всегда EAN-13). */
export const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;

/** Допустимая длина кода товара (EAN-8/13, UPC-A/E, GTIN-14). */
export const VALID_CODE_LENGTHS = [8, 12, 13, 14];

/** Максимальный размер скачиваемого фото продукта (байты). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Хосты, с которых разрешено скачивать фото. `image_url` приходит из
 * краудсорс-базы и публично редактируем, поэтому ходим только на их CDN (SSRF).
 */
export const ALLOWED_IMAGE_HOSTS = ["openfoodfacts.org", "openbeautyfacts.org"];

/** Таймаут внешних запросов (мс), чтобы зависший источник не блокировал поиск. */
export const LOOKUP_TIMEOUT_MS = 8000;
