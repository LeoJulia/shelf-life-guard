"use server";

import { createServerClient } from "@/shared/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidateProductLists } from "../utils/revalidate";

export const deleteProduct = async (id: string) => {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Delete product error", error);
  }

  revalidateProductLists();
  revalidatePath("/dashboard", "page");
  revalidatePath("/", "page");

  redirect("/dashboard");
};
