"use server";

import { createServerClient } from "@/shared/server";
import { revalidateTags } from "../lib/revalidate";

export const deleteTag = async (tagId: string): Promise<void> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Delete tag error: user is not authenticated");
  }

  // RLS ограничивает delete своими тегами, .eq("user_id") — явная защита.
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Delete tag error", { cause: error });
  }

  revalidateTags();
};
