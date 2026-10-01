"use server";

import { TablesUpdate } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImage } from "../utils/upload-image";
import { parseProductFormData } from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const updateProduct = async (id: string, formData: FormData) => {
  const supabase = await createServerClient();

  const updateProduct: TablesUpdate<"products"> = {
    ...parseProductFormData(formData),
  };

  const imgPath = await uploadImage(supabase, formData);

  if (imgPath) {
    updateProduct.image_path = imgPath;
  }

  const { error } = await supabase
    .from("products")
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
