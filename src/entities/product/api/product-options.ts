import { createServerClient } from "@/shared/server";
import type { TProductOption } from "../model";

/**
 * Лёгкий список баночек для выбора в формах: только id и подпись.
 *
 * Отдельно от getProductList, которому нужны все поля и подписанные URL
 * изображений — для пикера это лишние запросы к Storage.
 */
export const getProductOptions = async (): Promise<TProductOption[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, brand, name")
    .order("brand")
    .order("name");

  if (error) {
    throw new Error("Error on get product options", { cause: error });
  }

  return data.map((product) => ({
    id: product.id,
    label: `${product.brand} — ${product.name}`,
  }));
};
