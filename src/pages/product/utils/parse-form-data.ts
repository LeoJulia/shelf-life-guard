import { TProduct } from "@/entities/product";

const toString = (v: FormDataEntryValue | null): string | null => {
  if (v === null || v === undefined) return null;
  return typeof v === "string" ? v : null;
};

export const parseProductFormData = (formData: FormData): TProduct => {
  const marketPriceRaw = formData.get("market_price");
  const actualPriceRaw = formData.get("actual_price");
  const ratingRaw = formData.get("rating");

  return {
    brand: toString(formData.get("brand")),
    name: toString(formData.get("name")),
    category: toString(formData.get("category")),
    volume: toString(formData.get("volume")),
    market_price:
      marketPriceRaw && typeof marketPriceRaw === "string"
        ? Number(marketPriceRaw.replace(",", "."))
        : null,
    actual_price:
      actualPriceRaw && typeof actualPriceRaw === "string"
        ? Number(actualPriceRaw.replace(",", "."))
        : null,
    shop: toString(formData.get("shop")),
    rating:
      ratingRaw && typeof ratingRaw === "string"
        ? Number(ratingRaw)
        : null,
    expiry_date: toString(formData.get("expiry_date")),
    opened_at: toString(formData.get("opened_at")),
    finished_at: toString(formData.get("finished_at")),
    ingredients: toString(formData.get("ingredients")),
    notes: toString(formData.get("notes")),
  };
};