"use server";

import { createServerClient } from "@/shared/server";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * Перезаписывает порядок позиций: position = индекс в переданном списке.
 *
 * Каждая строка дополнительно фильтруется по routine_id, чтобы чужая позиция
 * не могла попасть в чужую рутину через подменённый список id.
 *
 * @returns текст ошибки или null при успехе
 */
export const setRoutineItemsOrder = async (
  routineId: string,
  orderedIds: string[],
): Promise<string | null> => {
  const supabase = await createServerClient();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("routine_items")
        .update({ position: index })
        .eq("id", id)
        .eq("routine_id", routineId),
    ),
  );

  if (results.some((result) => result.error)) {
    return "Не удалось изменить порядок";
  }

  revalidateRoutine(routineId);

  return null;
};
