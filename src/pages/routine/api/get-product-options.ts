import { createServerClient } from "@/shared/server";
import { formatDate } from "@/shared/lib/format-date";
import type { TProductOption } from "@/entities/product";

/**
 * Лёгкий список баночек для выбора в формах: только id и подпись.
 *
 * Отдельно от getProductList, которому нужны все поля и подписанные URL
 * изображений — для пикера это лишние запросы к Storage.
 *
 * Подписи обязаны быть уникальными: на них завязаны ключи строк combobox
 * и сопоставление подпись → id в рутине.
 */
export const getProductOptions = async (): Promise<TProductOption[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, brand, name, opened_at")
    .order("brand")
    .order("name")
    .order("created_at");

  if (error) {
    throw new Error("Error on get product options", { cause: error });
  }

  const labelCounts = new Map<string, number>();

  for (const product of data) {
    const label = `${product.brand} — ${product.name}`;
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }

  const usedLabels = new Set<string>();

  return data.map((product) => {
    let label = `${product.brand} — ${product.name}`;

    if ((labelCounts.get(label) ?? 0) > 1) {
      label += product.opened_at
        ? ` (открыта ${formatDate(product.opened_at)})`
        : " (не открыта)";
    }

    let uniqueLabel = label;

    for (let i = 2; usedLabels.has(uniqueLabel); i++) {
      uniqueLabel = `${label} №${i}`;
    }

    usedLabels.add(uniqueLabel);

    return { id: product.id, label: uniqueLabel };
  });
};
