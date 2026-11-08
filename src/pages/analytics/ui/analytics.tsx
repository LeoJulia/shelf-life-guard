import { byFinishedFirst } from "@/entities/product";
import { getProductList } from "@/widgets/product-list";
import { AnalyticsTable } from "./analytics-table";

export const Analytics = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  // Таблица аналитики не показывает изображения — не подписываем их.
  const { products } = await getProductList(params, { withImages: false });

  // порядок по умолчанию: сначала законченные баночки
  const orderedProducts = params?.sort
    ? products
    : [...products].sort(byFinishedFirst);

  return <AnalyticsTable products={orderedProducts} />;
};
