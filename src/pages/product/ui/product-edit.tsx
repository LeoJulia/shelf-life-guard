import { getProduct } from "../api/get-product";
import { getProductFormLists } from "../utils/get-form-lists";
import { updateProduct } from "../api/update-product";
import { ProductForm } from "./product-form";

export const ProductEdit = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const [product, lists] = await Promise.all([
    getProduct(id),
    getProductFormLists(),
  ]);

  return (
    <ProductForm
      action={updateProduct.bind(null, product.id)}
      product={product}
      {...lists}
    />
  );
};