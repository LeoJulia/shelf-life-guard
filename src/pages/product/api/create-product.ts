"use server";

import { TablesInsert } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import { redirect } from "next/navigation";
import { uploadImage } from "../utils/upload-image";
import { parseProductFormData } from "../utils/parse-form-data";
import { revalidateProductLists } from "../utils/revalidate";

export const createProduct = async (formData: FormData) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Create product error: user is not authenticated");
  }

  const newProduct: TablesInsert<"products"> = {
    ...parseProductFormData(formData),
    user_id: data.user.id,
  };

  const imgPath = await uploadImage(supabase, formData);

  if (imgPath) {
    newProduct.image_path = imgPath;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert(newProduct)
    .select()
    .single();

  if (error) {
    throw Error("Create product error", error);
  }

  revalidateProductLists();

  redirect(`/product/${product.id}`);
};
