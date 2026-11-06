"use server";

import {
  createServerClient,
  scheduleStorageMaintenance,
} from "@/shared/server";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * @returns текст ошибки или null при успехе
 */
export const deleteRoutinePhoto = async (
  photoId: string,
): Promise<string | null> => {
  const supabase = await createServerClient();

  try {
    const { data, error } = await supabase
      .from("routine_photos")
      .delete()
      .eq("id", photoId)
      .select("routine_id")
      .single();

    if (error) {
      return "Не удалось удалить фото";
    }

    revalidateRoutine(data.routine_id);

    return null;
  } finally {
    scheduleStorageMaintenance();
  }
};
