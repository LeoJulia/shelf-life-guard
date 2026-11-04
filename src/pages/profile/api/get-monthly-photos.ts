import { createServerClient } from "@/shared/server";
import { fetchSignedImageUrl } from "@/shared/lib/signed-image-url";
import { ROUTINE_PHOTOS_BUCKET } from "@/shared/lib/buckets";
import { formatMonthLabel } from "../lib/format-month-label";

/** Рутина с фотографиями в рамках одного месяца. */
export type TMonthlyRoutine = {
  routineId: string;
  name: string | null;
  startDate: string;
  endDate: string | null;
  photoCount: number;
  /** Signed URL одного кадра-превью, остальные подписываются по клику. */
  thumbUrl: string | null;
};

export type TMonthGroup = {
  /** Ключ месяца "YYYY-MM" — для key и сортировки. */
  monthKey: string;
  label: string;
  routines: TMonthlyRoutine[];
};

type TRoutineEmbed = {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string | null;
};

type TPhotoRow = {
  id: string;
  routine_id: string;
  series: string;
  slot: string;
  image_path: string;
  routines: TRoutineEmbed | null;
};

/** Кадр для превью: «после» анфас интереснее всего, дальше по убыванию. */
const pickThumb = (photos: TPhotoRow[]): TPhotoRow =>
  photos.find((photo) => photo.series === "end" && photo.slot === "front") ??
  photos.find((photo) => photo.series === "start" && photo.slot === "front") ??
  photos[0];

/**
 * Фотографии рутин, сгруппированные по месяцу начала рутины.
 *
 * Подписывается только один кадр на рутину: полный набор (до 14 фото)
 * подгружается отдельно при открытии превью, чтобы не плодить сотни
 * запросов к Storage на списке.
 */
export const getMonthlyPhotos = async (): Promise<TMonthGroup[]> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("routine_photos")
    .select(
      "id, routine_id, series, slot, image_path, routines(id, name, start_date, end_date)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Error on get monthly photos", { cause: error });
  }

  const rows = (data ?? []) as unknown as TPhotoRow[];

  const byRoutine = new Map<string, TPhotoRow[]>();
  for (const row of rows) {
    if (!row.routines) {
      continue;
    }
    const photos = byRoutine.get(row.routine_id);
    if (photos) {
      photos.push(row);
    } else {
      byRoutine.set(row.routine_id, [row]);
    }
  }

  const routines = await Promise.all(
    [...byRoutine.entries()].map(async ([routineId, photos]) => {
      const routine = photos[0].routines as TRoutineEmbed;
      const thumbUrl =
        (await fetchSignedImageUrl(
          supabase,
          ROUTINE_PHOTOS_BUCKET,
          pickThumb(photos).image_path,
        )) ?? null;

      return {
        routineId,
        name: routine.name,
        startDate: routine.start_date,
        endDate: routine.end_date,
        photoCount: photos.length,
        thumbUrl,
      } satisfies TMonthlyRoutine;
    }),
  );

  const byMonth = new Map<string, TMonthlyRoutine[]>();
  for (const routine of routines) {
    const monthKey = routine.startDate.slice(0, 7);
    const group = byMonth.get(monthKey);
    if (group) {
      group.push(routine);
    } else {
      byMonth.set(monthKey, [routine]);
    }
  }

  return [...byMonth.entries()]
    .map(([monthKey, monthRoutines]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      routines: monthRoutines.sort((left, right) =>
        right.startDate.localeCompare(left.startDate),
      ),
    }))
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
};
