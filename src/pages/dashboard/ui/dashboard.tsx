import { getProductList, ProductList } from "@/widgets/product-list";

export const Dashboard = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const products = await getProductList(await searchParams);

  return <ProductList products={products} />;
};
