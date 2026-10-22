import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tables } from "@/shared/model";
import { fetchSignedImageUrl } from "@/shared/lib/signed-image-url";
import {
  PRODUCT_IMAGES_BUCKET,
  ROUTINE_PHOTOS_BUCKET,
} from "@/shared/lib/buckets";
import {
  isPhotoSeries,
  isPhotoSlot,
  toTimeOfDay,
  type TRoutine,
  type TRoutineItem,
  type TRoutineItemProduct,
  type TRoutinePhoto,
} from "@/entities/routine";

/**
 * Строки, как их отдаёт PostgREST при вложенном select.
 *
 * Типы описаны вручную: supabase gen types не знает про вложение
 * routine_items в routines, так как FK объявлен на стороне routine_items
 * и в Relationships таблицы routines не попадает.
 */
export type TRoutineItemRow = Tables<"routine_items"> & {
  products?: TRoutineItemProduct | null;
};

export type TRoutineRow = Tables<"routines"> & {
  routine_items?: TRoutineItemRow[] | null;
  routine_photos?: Tables<"routine_photos">[] | null;
};

const mapItem = (row: TRoutineItemRow): TRoutineItem | null => {
  const timeOfDay = toTimeOfDay(row.time_of_day);

  if (!timeOfDay) {
    return null;
  }

  const { products, ...item } = row;

  return { ...item, time_of_day: timeOfDay, product: products ?? null };
};

const mapPhoto = (row: Tables<"routine_photos">): TRoutinePhoto | null =>
  isPhotoSeries(row.series) && isPhotoSlot(row.slot)
    ? { ...row, series: row.series, slot: row.slot }
    : null;

const compact = <T>(rows: (T | null)[]): T[] =>
  rows.filter((row): row is T => row !== null);

export const mapRoutineRow = (row: TRoutineRow): TRoutine => {
  const { routine_items, routine_photos, ...routine } = row;

  return {
    ...routine,
    // Сортируем на клиенте, а не через .order(..., { referencedTable }): так
    // порядок шагов гарантированно одинаков у списка и у страницы рутины.
    items: compact((routine_items ?? []).map(mapItem)).sort(
      (left, right) => left.position - right.position,
    ),
    photos: compact((routine_photos ?? []).map(mapPhoto)),
  };
};

/**
 * Подписывает URL изображений: миниатюры средств и фотографии лица.
 *
 * Отдельный шаг, а не часть mapRoutineRow: списку рутин картинки не нужны,
 * а каждый signed URL — это лишний запрос к Storage.
 */
export const signRoutineImages = async (
  supabase: SupabaseClient,
  routine: TRoutine,
): Promise<TRoutine> => {
  const [items, photos] = await Promise.all([
    Promise.all(
      (routine.items ?? []).map(async (item) => {
        if (!item.product?.image_path) {
          return item;
        }

        const imageUrl = await fetchSignedImageUrl(
          supabase,
          PRODUCT_IMAGES_BUCKET,
          item.product.image_path,
        );

        return {
          ...item,
          product: { ...item.product, imageUrl: imageUrl ?? null },
        };
      }),
    ),
    Promise.all(
      (routine.photos ?? []).map(async (photo) => ({
        ...photo,
        imageUrl:
          (await fetchSignedImageUrl(
            supabase,
            ROUTINE_PHOTOS_BUCKET,
            photo.image_path,
          )) ?? null,
      })),
    ),
  ]);

  return { ...routine, items, photos };
};
