/**
 * Справочник серий и ракурсов фотографий лица в рутине.
 *
 * Единственный источник кодов и русских подписей. Коды обязаны совпадать
 * с CHECK-ограничениями routine_photos.series / routine_photos.slot
 * (см. supabase/routine-schema.sql) — синхронизируются вручную.
 */

export const routinePhotoSeries = {
  start: "Начало использования",
  end: "Конец использования",
} as const;

export type TPhotoSeries = keyof typeof routinePhotoSeries;

export const routinePhotoSeriesOrder = Object.keys(
  routinePhotoSeries,
) as TPhotoSeries[];

export const routinePhotoSlots = {
  front: "Анфас",
  right: "Правый профиль",
  left: "Левый профиль",
  up: "Взгляд вверх",
  down: "Взгляд вниз",
  zone1: "Проблемная зона 1",
  zone2: "Проблемная зона 2",
} as const;

export type TPhotoSlot = keyof typeof routinePhotoSlots;

export const routinePhotoSlotOrder = Object.keys(
  routinePhotoSlots,
) as TPhotoSlot[];

/** Подсказки по съёмке для каждого ракурса. */
export const routinePhotoSlotHints: Record<TPhotoSlot, string> = {
  front: "Глаза прямо в камеру",
  right: "Голова повёрнута вправо",
  left: "Голова повёрнута влево",
  up: "Взгляд вверх",
  down: "Взгляд вниз",
  zone1: "Крупный план, зона 1",
  zone2: "Крупный план, зона 2",
};

export const isPhotoSeries = (value: string): value is TPhotoSeries =>
  value in routinePhotoSeries;

export const isPhotoSlot = (value: string): value is TPhotoSlot =>
  value in routinePhotoSlots;
