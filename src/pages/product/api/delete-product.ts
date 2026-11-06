"use server";

import {
  createServerClient,
  scheduleStorageMaintenance,
} from "@/shared/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidateProductLists } from "../utils/revalidate";

export const deleteProduct = async (id: string) => {
  const supabase = await createServerClient();

  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error("Delete product error", { cause: error });
    }
  } finally {
    scheduleStorageMaintenance();
  }

  revalidateProductLists();
  revalidatePath("/dashboard", "page");
  revalidatePath("/", "page");

  redirect("/dashboard");
};
