"use server";

import type { TablesInsert } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import {
  hasAnyWeekday,
  isConstantSchedule,
  type TTimeOfDay,
  type TWeekdayFlags,
} from "@/entities/routine";
import { revalidateRoutine } from "../lib/revalidate";
import { routineOwnedByCurrentUser } from "../lib/routine-ownership";

/**
 * Добавляет средство в рутину или обновляет его расписание, если оно уже там.
 *
 * Уникальность (routine_id, product_id) в БД означает, что «утром и вечером»
 * выражается одной позицией с time_of_day = 'both', а не двумя строками.
 *
 * @returns текст ошибки или null при успехе
 */
export const upsertRoutineItem = async (
  routineId: string,
  productId: string,
  timeOfDay: TTimeOfDay,
  days: TWeekdayFlags,
): Promise<string | null> => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return "Требуется вход в аккаунт";
  }

  if (!productId) {
    return "Выберите средство";
  }

  if (!hasAnyWeekday(days)) {
    return "Отметьте хотя бы один день недели";
  }

  if (!(await routineOwnedByCurrentUser(supabase, routineId))) {
    return "Рутина не найдена";
  }

  const schedule = {
    time_of_day: timeOfDay,
    is_constant: isConstantSchedule(days),
    ...days,
  };

  const { data: existing } = await supabase
    .from("routine_items")
    .select("id")
    .eq("routine_id", routineId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("routine_items")
      .update(schedule)
      .eq("id", existing.id);

    if (error) {
      return "Не удалось сохранить средство";
    }
  } else {
    const { data: last } = await supabase
      .from("routine_items")
      .select("position")
      .eq("routine_id", routineId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newItem: TablesInsert<"routine_items"> = {
      ...schedule,
      routine_id: routineId,
      product_id: productId,
      user_id: data.user.id,
      position: (last?.position ?? -1) + 1,
    };

    const { error } = await supabase.from("routine_items").insert(newItem);

    if (error) {
      return "Не удалось добавить средство";
    }
  }

  revalidateRoutine(routineId);

  return null;
};
