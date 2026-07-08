import {
  getBrandsList,
  getCategoriesList,
  getShopsList,
  getVolumesList,
} from "@/entities/filter";
import { getProduct } from "../api/get-product";
import { ProductForm } from "./product-form";

export const ProductEdit = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const product = await getProduct(id);
  const brandsList = await getBrandsList();
  const categoriesList = await getCategoriesList();
  const volumesList = await getVolumesList();
  const shopsList = await getShopsList();

  return (
    <ProductForm
      product={product}
      brandsList={brandsList}
      categoriesList={categoriesList}
      volumesList={volumesList}
      shopsList={shopsList}
    />
  );
};
