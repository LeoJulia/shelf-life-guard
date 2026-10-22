"use server";

import { createServerClient } from "@/shared/server";
import { ROUTINE_PHOTOS_BUCKET } from "@/shared/lib/buckets";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * @returns текст ошибки или null при успехе
 */
export const deleteRoutinePhoto = async (
  photoId: string,
): Promise<string | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("routine_photos")
    .delete()
    .eq("id", photoId)
    .select("routine_id, image_path")
    .single();

  if (error) {
    return "Не удалось удалить фото";
  }

  await supabase.storage.from(ROUTINE_PHOTOS_BUCKET).remove([data.image_path]);

  revalidateRoutine(data.routine_id);

  return null;
};
