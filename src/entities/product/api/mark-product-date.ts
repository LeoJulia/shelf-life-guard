"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/shared/server";
import type { TablesUpdate } from "@/shared/model";
import { markTodayFields, type TMarkTodayAction } from "../config/mark-today";

export const markProductDate = async (
  productId: string,
  action: TMarkTodayAction,
  date: string,
) => {
  const field = markTodayFields[action];

  if (!field || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid mark date request");
  }

  const supabase = await createServerClient();

  const update: TablesUpdate<"products"> = { [field]: date };

  const { error } = await supabase
    .from("products")
    .update(update)
    .eq("id", productId);

  if (error) {
    throw new Error("Mark product date error", { cause: error });
  }

  revalidatePath(`/product/${productId}`, "page");
  revalidatePath("/dashboard", "page");
  revalidatePath("/products", "page");
};
