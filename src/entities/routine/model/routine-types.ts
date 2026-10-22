import type { Tables } from "@/shared/model";
import type { TPhotoSeries, TPhotoSlot } from "../config/photo-slots";
import type { TTimeOfDay } from "../config/time-of-day";

/**
 * Минимальный набор полей баночки, нужный рутине.
 *
 * Берётся из @/shared/model, а не из @/entities/product: steiger запрещает
 * cross-import между срезами entities.
 */
export type TRoutineItemProduct = Pick<
  Tables<"products">,
  "id" | "name" | "brand" | "image_path"
> & {
  /** Signed URL, в БД не хранится. */
  imageUrl?: string | null;
};

/**
 * Позиция рутины.
 *
 * time_of_day, series и slot в БД — text с CHECK-ограничением, а supabase
 * gen types выдаёт для них просто string, поэтому значения сужаются до
 * союзов из config/.
 */
export type TRoutineItem = Omit<Tables<"routine_items">, "time_of_day"> & {
  time_of_day: TTimeOfDay;
  product?: TRoutineItemProduct | null;
};

export type TRoutinePhoto = Omit<
  Tables<"routine_photos">,
  "series" | "slot"
> & {
  series: TPhotoSeries;
  slot: TPhotoSlot;
  /** Signed URL, в БД не хранится. */
  imageUrl?: string | null;
};

export type TRoutine = Tables<"routines"> & {
  items?: TRoutineItem[];
  photos?: TRoutinePhoto[];
};

/**
 * Значения формы создания/редактирования рутины.
 *
 * Описаны явно, а не через Pick<TablesUpdate<"routines">>: там start_date
 * опционален, а для insert он обязателен — явный тип пригоден и для insert,
 * и для update без приведений.
 */
export type TRoutineFormValues = {
  name: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
};

/** Состояние формы рутины для useActionState: текст ошибки или null. */
export type TRoutineFormState = {
  error: string | null;
};
