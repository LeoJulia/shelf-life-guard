import { createServerClient } from "@/shared/server";
import { TProduct } from "@/entities/product";
import { getProductTags } from "@/entities/tag";
import { fetchProductImageUrl } from "../utils/get-image-url";

export const getProduct = async (id: string): Promise<TProduct> => {
  const supabase = await createServerClient();

  if (!id) {
    throw new Error("Not provided product id");
  }

  const [{ data: product, error }, tags] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    getProductTags(id),
  ]);

  if (error) {
    throw new Error("Error during get product", error);
  }

  return {
    ...product,
    imageUrl: await fetchProductImageUrl(supabase, product.image_path),
    tags,
  };
};
