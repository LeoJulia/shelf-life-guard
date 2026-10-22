"use server";

import { TablesUpdate } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import { syncProductTags } from "@/entities/tag";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadBase64Image } from "@/shared/lib/upload-image";
import { PRODUCT_IMAGES_BUCKET } from "@/shared/lib/buckets";
import { parseProductFormData, parseProductTags } from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const updateProduct = async (id: string, formData: FormData) => {
  const supabase = await createServerClient();

  const updateProduct: TablesUpdate<"products"> = {
    ...parseProductFormData(formData),
  };

  const imgPath = await uploadBase64Image(
    supabase,
    PRODUCT_IMAGES_BUCKET,
    formData,
  );

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

  await syncProductTags(id, parseProductTags(formData));

  revalidatePath(`/product/${id}/edit`, "page");
  revalidatePath(`/product/${id}`, "page");

  revalidateProductLists();

  redirect(`/product/${id}`);
};
