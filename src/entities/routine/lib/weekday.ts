import { toLocalDateString } from "@/shared/lib/local-date";

export const weekdayKeys = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type TWeekdayKey = (typeof weekdayKeys)[number];

/**
 * Набор флагов дней недели. Совпадает с булевыми колонками
 * routine_items.mon … routine_items.sun.
 */
export type TWeekdayFlags = Record<TWeekdayKey, boolean>;

export const weekdayLabels: Record<TWeekdayKey, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Вс",
};

export const weekdayFullLabels: Record<TWeekdayKey, string> = {
  mon: "Понедельник",
  tue: "Вторник",
  wed: "Среда",
  thu: "Четверг",
  fri: "Пятница",
  sat: "Суббота",
  sun: "Воскресенье",
};

export const ALL_WEEKDAYS: TWeekdayFlags = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: true,
  sun: true,
};

export const NONE_WEEKDAYS: TWeekdayFlags = {
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
  sun: false,
};

/**
 * День недели для даты в формате YYYY-MM-DD.
 *
 * Date собирается из локальных частей, а не через new Date(iso): строка
 * YYYY-MM-DD парсится как UTC и в отрицательных часовых поясах уводит
 * на день назад.
 */
const getWeekdayKey = (date: string): TWeekdayKey => {
  const [year, month, day] = date.split("-").map(Number);
  const jsDay = new Date(year, month - 1, day).getDay();

  return jsDay === 0 ? "sun" : weekdayKeys[jsDay - 1];
};

export const getTodayWeekdayKey = (
  today: string = toLocalDateString(),
): TWeekdayKey => getWeekdayKey(today);

/** Постоянное средство — включены все 7 дней. */
export const isConstantSchedule = (days: TWeekdayFlags): boolean =>
  weekdayKeys.every((key) => days[key]);

/**
 * Переключатель «Все дни»: полный набор снимается целиком, любой неполный
 * разворачивается до полного.
 */
export const toggleAllWeekdays = (days: TWeekdayFlags): TWeekdayFlags =>
  isConstantSchedule(days) ? NONE_WEEKDAYS : ALL_WEEKDAYS;

export const hasAnyWeekday = (days: TWeekdayFlags): boolean =>
  weekdayKeys.some((key) => days[key]);

/**
 * Выбирает из строки только флаги дней недели.
 *
 * Нужен потому, что прямой spread позиции рутины утащил бы в экшен и дальше
 * в UPDATE все остальные колонки строки.
 */
export const pickWeekdayFlags = (source: TWeekdayFlags): TWeekdayFlags => ({
  mon: source.mon,
  tue: source.tue,
  wed: source.wed,
  thu: source.thu,
  fri: source.fri,
  sat: source.sat,
  sun: source.sun,
});
