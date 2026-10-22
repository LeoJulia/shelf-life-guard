import { createServerClient } from "@/shared/server";
import { byActiveFirst, type TRoutine } from "@/entities/routine";
import { mapRoutineRow, type TRoutineRow } from "../lib/map-routine";

/**
 * Список рутин без подписанных URL изображений и без данных средств: карточке
 * нужны только названия, статус и счётчики, поэтому `products(...)` здесь не
 * выбирается — каждый лишний вложенный join это запрос к Storage и БД.
 *
 * Порядок: активные сверху, затем запланированные, затем завершённые;
 * внутри группы — по убыванию даты начала (sort стабилен).
 */
export const getRoutineList = async (): Promise<TRoutine[]> => {
  const supabase = await createServerClient();

  const select = "*, routine_items(*), routine_photos(id, series, slot)";

  const { data, error } = await supabase
    .from("routines")
    .select(select)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error("Error on get routine list", { cause: error });
  }

  const routines = ((data ?? []) as TRoutineRow[]).map(mapRoutineRow);

  return routines.sort(byActiveFirst);
};
