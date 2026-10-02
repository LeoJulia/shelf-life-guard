import { getProductList } from "@/entities/product";
import { ProductList } from "@/widgets/product-list";

export const Products = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const products = await getProductList(await searchParams);

  return <ProductList products={products} />;
};
