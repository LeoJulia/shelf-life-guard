import { toLocalDateString } from "@/shared/lib/local-date";

/**
 * Статус рутины не хранится в БД — выводится из дат, как getProductStatus
 * у баночек (src/entities/product/model/product-status.ts).
 */
export const routineStatusLabels = {
  planned: "Запланирована",
  active: "Активна",
  finished: "Завершена",
} as const;

export type TRoutineStatus = keyof typeof routineStatusLabels;

/** Минимум полей, нужный для вывода статуса. Tables<"routines"> этому удовлетворяет. */
export type TRoutineDates = {
  start_date: string;
  end_date: string | null;
};

/**
 * Даты в формате YYYY-MM-DD сравниваются лексикографически, что совпадает
 * с хронологическим порядком.
 *
 * Граничный случай: end_date == today — рутина ещё активна.
 */
export const getRoutineStatus = (
  routine: TRoutineDates,
  today: string = toLocalDateString(),
): TRoutineStatus => {
  if (routine.end_date && routine.end_date < today) {
    return "finished";
  }

  return routine.start_date <= today ? "active" : "planned";
};

export const routineStatusRanks: Record<TRoutineStatus, number> = {
  active: 0,
  planned: 1,
  finished: 2,
};

/** Активные сверху, затем запланированные, затем завершённые. */
export const byActiveFirst = (
  left: TRoutineDates,
  right: TRoutineDates,
  today: string = toLocalDateString(),
) =>
  routineStatusRanks[getRoutineStatus(left, today)] -
  routineStatusRanks[getRoutineStatus(right, today)];
