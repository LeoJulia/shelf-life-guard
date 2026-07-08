"use server";

import { TProduct } from "@/entities/product";
import { createServerClient } from "@/shared/server";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const updateProduct = async (id: string, formData: FormData) => {
  console.log("formData", formData);
  console.log("brand", formData.get("brand"));
  const supabase = await createServerClient();

  const updateProduct: TProduct = {
    brand: formData.get("brand"),
    name: formData.get("name"),
    category: formData.get("category"),
    volume: formData.get("volume") ?? null,
    market_price: formData.get("market_price")
      ? Number(formData.get("market_price"))
      : null,
    actual_price: formData.get("actual_price")
      ? Number(formData.get("actual_price"))
      : null,
    shop: formData.get("shop"),
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
  };

  const { error } = await supabase
    .from("products")
    .update(updateProduct)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw Error("Update product error", error);
  }

  revalidatePath(`/product/${id}/edit`);
  revalidatePath(`/product/${id}`);
  redirect(`/product/${id}`);
};
