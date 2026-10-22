/**
 * Пометка времени суток у позиции рутины.
 *
 * В БД это routine_items.time_of_day (text + CHECK). Supabase gen types
 * не переносит CHECK-ограничения в типы и выдаёт просто string, поэтому
 * на уровне приложения тип сужается здесь, а коды обязаны совпадать
 * с CHECK-списком в supabase/routine-schema.sql.
 *
 * «Один набор косметики» выражается тем, что у всех позиций стоит both.
 */
export const timeOfDayLabels = {
  morning: "Утро",
  evening: "Вечер",
  both: "Утро и вечер",
} as const;

export type TTimeOfDay = keyof typeof timeOfDayLabels;

export const timeOfDayOrder = Object.keys(timeOfDayLabels) as TTimeOfDay[];

export const isTimeOfDay = (value: string): value is TTimeOfDay =>
  value in timeOfDayLabels;

/**
 * Сужает строку из БД до TTimeOfDay.
 *
 * Нужен потому, что supabase gen types выдаёт для text-колонки просто string,
 * а CHECK-ограничение в типы не переносится.
 */
export const toTimeOfDay = (value: string): TTimeOfDay | null =>
  isTimeOfDay(value) ? value : null;
