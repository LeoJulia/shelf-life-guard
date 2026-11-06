"use server";

import {
  createServerClient,
  scheduleStorageMaintenance,
} from "@/shared/server";
import { redirect } from "next/navigation";
import { revalidateRoutineLists } from "../lib/revalidate";

export const deleteRoutine = async (id: string) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Delete routine error: user is not authenticated");
  }

  try {
    const { error } = await supabase
      .from("routines")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error("Delete routine error", { cause: error });
    }
  } finally {
    scheduleStorageMaintenance();
  }

  revalidateRoutineLists();

  redirect("/routine");
};
