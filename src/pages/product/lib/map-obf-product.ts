import type { TScannedProduct } from "../model/barcode-types";

/** Минимальная форма ответа OBF /api/v2/product. */
export type TOBFProduct = {
  product_name?: string;
  product_name_ru?: string;
  brands?: string;
  quantity?: string;
  ingredients_text?: string;
  inci_name?: string;
  categories?: string;
  image_url?: string;
};

const clean = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Первая метка из списка, разделённого запятой (для brands / categories OBF).
 * Для категории берём первую — она обычно самая общая и человекочитаемая.
 */
const firstTag = (value?: string | null): string | undefined =>
  clean(value?.split(",")[0]);

/** У категорий OFF метки приходят с lang-префиксом («nl:Beauty») — срезаем его. */
const LANG_PREFIX_RE = /^[a-z]{2,3}:/;
const firstCategory = (value?: string | null): string | undefined =>
  firstTag(value)?.replace(LANG_PREFIX_RE, "");

/** Приводит сырой продукт OBF к полям нашей формы. Пустое → undefined (не затираем ручной ввод). */
export const mapOBFProduct = (raw: TOBFProduct): TScannedProduct => ({
  brand: firstTag(raw.brands),
  name: clean(raw.product_name_ru) ?? clean(raw.product_name),
  volume: clean(raw.quantity),
  category: firstCategory(raw.categories),
  ingredients: clean(raw.ingredients_text) ?? clean(raw.inci_name),
});

export const extractImageUrl = (raw: TOBFProduct): string | undefined =>
  clean(raw.image_url);
