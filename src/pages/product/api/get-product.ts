import { createServerClient } from "@/shared/server";
import { TProduct } from "@/entities/product";

export const getProduct = async (id: string): Promise<TProduct> => {
  const supabase = await createServerClient();

  if (!id) {
    throw new Error("Not provided product id");
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Error during get product", error);
  }

  if (product.image_path) {
    const { data } = await supabase.storage
      .from("product-images")
      .createSignedUrl(product.image_path, 3600);

    product.imageUrl = data?.signedUrl;
  }

  return product;
};
