/**
 * Данные продукта, полученные по штрих-коду из Open Beauty Facts.
 * Все поля опциональны: база краудсорсинговая, часто заполнена частично.
 * `imageBase64` — data URL, готовый к показу в ImageUpload и к загрузке в Storage.
 */
export type TScannedProduct = {
  brand?: string;
  name?: string;
  volume?: string;
  category?: string;
  ingredients?: string;
  imageBase64?: string;
};

export type TBarcodeLookupResult =
  | { found: true; code: string; product: TScannedProduct }
  | {
      found: false;
      code: string;
      /** not_found — продукта нет в базах; source_error — источник недоступен/ошибся. */
      reason: "not_found" | "source_error";
    };
