import { getProductFormLists } from "../utils/get-form-lists";
import { createProduct } from "../api/create-product";
import { ProductForm } from "./product-form";

export const ProductCreate = async () => {
  const lists = await getProductFormLists();

  return <ProductForm action={createProduct} {...lists} />;
};