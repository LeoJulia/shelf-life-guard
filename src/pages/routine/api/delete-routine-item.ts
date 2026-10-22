"use server";

import { createServerClient } from "@/shared/server";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * @returns текст ошибки или null при успехе
 */
export const deleteRoutineItem = async (
  itemId: string,
): Promise<string | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("routine_items")
    .delete()
    .eq("id", itemId)
    .select("routine_id")
    .single();

  if (error) {
    return "Не удалось удалить средство";
  }

  revalidateRoutine(data.routine_id);

  return null;
};
