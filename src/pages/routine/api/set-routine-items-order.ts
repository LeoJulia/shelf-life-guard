"use server";

import { createServerClient } from "@/shared/server";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * Перезаписывает порядок позиций: position = индекс в переданном списке.
 *
 * Вызывается из useRoutineItemsOrder отложенно, поэтому полный список id
 * уходит один раз на пачку перестановок, а не на каждый клик по стрелке.
 *
 * RPC проверяет принадлежность всех позиций рутине и меняет порядок
 * целиком в одной транзакции.
 *
 * @returns текст ошибки или null при успехе
 */
export const setRoutineItemsOrder = async (
  routineId: string,
  orderedIds: string[],
): Promise<string | null> => {
  const supabase = await createServerClient();

  try {
    const { error } = await supabase.rpc("set_routine_items_order", {
      p_routine_id: routineId,
      p_ordered_ids: orderedIds,
    });

    if (error) {
      return "Не удалось изменить порядок";
    }
  } catch {
    return "Не удалось изменить порядок";
  }

  revalidateRoutine(routineId);

  return null;
};
