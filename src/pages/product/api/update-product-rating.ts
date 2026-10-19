"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/shared/server";
import type { TablesUpdate } from "@/shared/model";

export const updateProductRating = async (
  productId: string,
  rating: number | null,
) => {
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error("Invalid rating value");
  }

  const supabase = await createServerClient();

  const update: TablesUpdate<"products"> = { rating };

  const { error } = await supabase
    .from("products")
    .update(update)
    .eq("id", productId);

  if (error) {
    throw new Error("Update product rating error", { cause: error });
  }

  revalidatePath(`/product/${productId}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/products", "page");
};
