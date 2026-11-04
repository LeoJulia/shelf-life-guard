"use server";

import { createServerClient } from "@/shared/server";
import { fetchSignedImageUrl } from "@/shared/lib/signed-image-url";
import { ROUTINE_PHOTOS_BUCKET } from "@/shared/lib/buckets";
import {
  isPhotoSeries,
  isPhotoSlot,
  type TRoutinePhoto,
} from "@/entities/routine";

export type TRoutinePhotosPreview = {
  name: string | null;
  startDate: string;
  endDate: string | null;
  photos: TRoutinePhoto[];
};

/**
 * Полный набор подписанных фотографий одной рутины для превью в кабинете.
 *
 * Вызывается из Dialog при открытии, поэтому подписывает все кадры сразу —
 * в списке месяцев намеренно подписывается только одно превью.
 */
export const getRoutinePhotosPreview = async (
  routineId: string,
): Promise<TRoutinePhotosPreview | null> => {
  if (!routineId) {
    return null;
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("routines")
    .select("id, name, start_date, end_date, routine_photos(*)")
    .eq("id", routineId)
    .single();

  if (error || !data) {
    return null;
  }

  const rows = (data.routine_photos ?? []) as TRoutinePhoto[];

  const photos = await Promise.all(
    rows
      .filter((row) => isPhotoSeries(row.series) && isPhotoSlot(row.slot))
      .map(async (row) => ({
        ...row,
        imageUrl:
          (await fetchSignedImageUrl(
            supabase,
            ROUTINE_PHOTOS_BUCKET,
            row.image_path,
          )) ?? null,
      })),
  );

  return {
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    photos,
  };
};
