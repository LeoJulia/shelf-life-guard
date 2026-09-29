"use server";

import { TProduct } from "@/entities/product";
import { createServerClient } from "@/shared/server";
import { redirect } from "next/navigation";
import { uploadImage } from "../utils/upload-image";
import { parseProductFormData } from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const createProduct = async (formData: FormData) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  const newProduct: TProduct = {
    ...parseProductFormData(formData),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    user_id: data?.user?.id,
  };

  const imgPath = await uploadImage(supabase, formData);

  if (imgPath) {
    newProduct.image_path = imgPath;
  }

  const { data: product, error } = await supabase
    .from("products")
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    .insert(newProduct)
    .select()
    .single();

  if (error) {
    throw Error("Create product error", error);
  }

  revalidateProductLists();

  redirect(`/product/${product.id}`);
};
