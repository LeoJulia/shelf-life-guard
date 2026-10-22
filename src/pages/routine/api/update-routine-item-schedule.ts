"use server";

import { createServerClient } from "@/shared/server";
import {
  isConstantSchedule,
  type TTimeOfDay,
  type TWeekdayFlags,
} from "@/entities/routine";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * Меняет расписание позиции: время суток и дни недели.
 *
 * is_constant не принимается от клиента, а вычисляется: это производное от
 * флагов дней, и CHECK в БД всё равно не дал бы им разъехаться.
 *
 * Пустой набор дней — легальное состояние: средство остаётся в рутине, но не
 * попадает ни в один «Сегодня». Требование «хотя бы один день» касается только
 * добавления нового средства (см. upsertRoutineItem).
 *
 * @returns текст ошибки или null при успехе
 */
export const updateRoutineItemSchedule = async (
  itemId: string,
  timeOfDay: TTimeOfDay,
  days: TWeekdayFlags,
): Promise<string | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("routine_items")
    .update({
      time_of_day: timeOfDay,
      is_constant: isConstantSchedule(days),
      ...days,
    })
    .eq("id", itemId)
    .select("routine_id")
    .single();

  if (error) {
    return "Не удалось сохранить расписание";
  }

  revalidateRoutine(data.routine_id);

  return null;
};
