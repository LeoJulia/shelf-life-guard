import {
  getProductList,
  ProductList,
  PRODUCT_LIST_PAGE_SIZE,
} from "@/widgets/product-list";

export const Dashboard = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const result = await getProductList(await searchParams, {
    pageSize: PRODUCT_LIST_PAGE_SIZE,
  });

  return <ProductList {...result} />;
};
