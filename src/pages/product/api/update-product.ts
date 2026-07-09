"use server";

import { TProduct } from "@/entities/product";
import { createServerClient } from "@/shared/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const updateProduct = async (id: string, formData: FormData) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  const updateProduct: TProduct = {
    brand: formData.get("brand"),
    name: formData.get("name"),
    category: formData.get("category"),
    volume: formData.get("volume") || null,
    market_price: formData.get("market_price")
      ? Number(formData.get("market_price"))
      : null,
    actual_price: formData.get("actual_price")
      ? Number(formData.get("actual_price"))
      : null,
    shop: formData.get("shop"),
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
    expiry_date: formData.get("expiry_date") || null,
    opened_at: formData.get("opened_at") || null,
    finished_at: formData.get("finished_at") || null,
    ingredients: formData.get("ingredients"),
    notes: formData.get("notes"),
  };

  const image = formData.get("image");

  if (image && /^data:image\/[^;]+;base64,/.test(image)) {
    const [header, base64] = image.split(",");

    const contentType = header.match(/data:(.*);base64/)![1];

    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }

    const blob = new Blob([array], { type: contentType });

    const ext = image.match(/^data:image\/([^;]+);base64,/)?.[1];

    const fileName = `${crypto.randomUUID()}.${ext}`;
    const path = `${data?.user?.id}/${fileName}`;

    console.log("path", path);

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, blob);

    if (error) {
      throw error;
    }

    updateProduct.image_path = path;
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

  revalidatePath(`/product/${id}/edit`);
  revalidatePath(`/product/${id}`);
  redirect(`/product/${id}`);
};
