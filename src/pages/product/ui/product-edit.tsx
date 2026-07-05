import { getProduct } from "../api/get-product";
import { ProductForm } from "./product-form";

export const ProductEdit = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const product = await getProduct(id);

  return <ProductForm product={product} />;
};
