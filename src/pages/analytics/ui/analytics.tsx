import { byFinishedFirst, getProductList } from "@/entities/product";
import { AnalyticsTable } from "./analytics-table";

export const Analytics = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const products = await getProductList(params);

  // порядок по умолчанию: сначала законченные баночки
  const orderedProducts = params?.sort
    ? products
    : [...products].sort(byFinishedFirst);

  return <AnalyticsTable products={orderedProducts} />;
};
