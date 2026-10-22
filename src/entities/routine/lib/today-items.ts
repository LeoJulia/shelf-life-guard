import type { TTimeOfDay } from "../config/time-of-day";
import type { TWeekdayFlags, TWeekdayKey } from "./weekday";

/**
 * Структурный тип расписания позиции. Tables<"routine_items"> с суженным
 * time_of_day ему удовлетворяет, поэтому хелперы не зависят от типов БД.
 */
export type TRoutineItemSchedule = TWeekdayFlags & {
  time_of_day: TTimeOfDay;
  position: number;
};

export const timeParts = ["morning", "evening"] as const;

export type TTimePart = (typeof timeParts)[number];

/** Средство относится к части суток, если помечено ею или «both». */
export const matchesTimePart = (
  timeOfDay: TTimeOfDay,
  part: TTimePart,
): boolean => timeOfDay === part || timeOfDay === "both";

const isItemScheduledAt = <T extends TRoutineItemSchedule>(
  item: T,
  day: TWeekdayKey,
  part: TTimePart,
): boolean => item[day] && matchesTimePart(item.time_of_day, part);

/**
 * Средства, которые попадают на указанный день недели и часть суток,
 * в порядке применения (position).
 */
export const selectItemsForNow = <T extends TRoutineItemSchedule>(
  items: T[],
  day: TWeekdayKey,
  part: TTimePart,
): T[] =>
  items
    .filter((item) => isItemScheduledAt(item, day, part))
    .sort((left, right) => left.position - right.position);
