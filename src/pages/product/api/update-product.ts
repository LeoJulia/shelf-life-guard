"use server";

import { TProduct } from "@/entities/product";
import { createServerClient } from "@/shared/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "../utils/upload-image";
import { parseProductFormData } from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const updateProduct = async (id: string, formData: FormData) => {
  const supabase = await createServerClient();

  const updateProduct: TProduct = {
    ...parseProductFormData(formData),
  };

  const imgPath = await uploadImage(supabase, formData);

  if (imgPath) {
    updateProduct.image_path = imgPath;
  }

  const { error } = await supabase
    .from("products")
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    .update(updateProduct)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw Error("Update product error", error);
  }

  revalidatePath(`/product/${id}/edit`, "page");
  revalidatePath(`/product/${id}`, "page");

  revalidateProductLists();

  redirect(`/product/${id}`);
};
