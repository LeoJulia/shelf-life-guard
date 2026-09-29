import { getProductFormLists } from "../utils/get-form-lists";
import { ProductForm } from "./product-form";

export const ProductCreate = async () => {
  const lists = await getProductFormLists();

  return <ProductForm {...lists} />;
};