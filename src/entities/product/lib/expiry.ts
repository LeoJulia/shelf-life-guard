import { toLocalDateString } from "@/shared/lib/local-date";
import type { TProduct } from "../model";

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Окно «Скоро просрок» — согласовано с фильтром списка продуктов. */
export const EXPIRING_SOON_DAYS = 30;

/** Локальная календарная дата (YYYY-MM-DD) из date-строки или timestamp. */
const toDayString = (value: string | Date): string =>
  typeof value === "string" && DATE_RE.test(value)
    ? value
    : toLocalDateString(new Date(value));

/** Локальная полночь календарной даты в мс: сравнение по дням, не по времени. */
const toDayTime = (value: string | Date): number => {
  const [year, month, day] = toDayString(value).split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

/**
 * Доля оставшегося срока годности (0–100) от периода «открытие/добавление → срок».
 * 0% для просроченных (сегодня включительно) и для баночек, добавленных после
 * истечения срока: вырожденный период иначе даёт деление минуса на минус → 100%.
 */
export const getExpiryProgress = (
  product: Pick<TProduct, "expiry_date" | "opened_at" | "created_at">,
  now: Date = new Date(),
): number => {
  if (!product.expiry_date) {
    return 0;
  }

  const expiry = toDayTime(product.expiry_date);
  const start = toDayTime(product.opened_at ?? product.created_at);
  const total = expiry - start;
  const remaining = expiry - toDayTime(now);

  if (total <= 0 || remaining <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
};

/**
 * Истекает в ближайшие `days` календарных дней, включая сегодня. Даты сравниваются
 * как YYYY-MM-DD, а не как момент времени — иначе срок «сегодня» выпадает сразу
 * после полуночи.
 */
export const isExpiringSoon = (
  product: Pick<TProduct, "expiry_date" | "finished_at">,
  now: Date = new Date(),
  days: number = EXPIRING_SOON_DAYS,
): boolean => {
  if (!product.expiry_date || product.finished_at) {
    return false;
  }

  const today = toLocalDateString(now);
  const limit = toLocalDateString(new Date(now.getTime() + days * DAY_MS));

  return product.expiry_date >= today && product.expiry_date <= limit;
};
