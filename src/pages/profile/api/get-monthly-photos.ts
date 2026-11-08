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

export type TMonthlyPhotosResult = {
  groups: TMonthGroup[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type TPhotoEmbed = {
  id: string;
  series: string;
  slot: string;
  image_path: string;
};

type TRoutineRow = {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string | null;
  routine_photos: TPhotoEmbed[] | null;
};

/** Кадр для превью: «после» анфас интереснее всего, дальше по убыванию. */
const pickThumb = (photos: TPhotoEmbed[]): TPhotoEmbed =>
  photos.find((photo) => photo.series === "end" && photo.slot === "front") ??
  photos.find((photo) => photo.series === "start" && photo.slot === "front") ??
  photos[0];

const parsePage = (value: string | string[] | undefined) => {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
};

/**
 * Фотографии рутин, сгруппированные по месяцу начала рутины.
 *
 * Пагинация идёт по карточкам рутин (а не по кадрам): запрос от routines с
 * routine_photos!inner отдаёт только рутины с фото и точный count таких рутин,
 * поэтому список не обрезается на лимите Data API. Подписывается один кадр на
 * рутину; полный набор подгружается отдельно при открытии превью.
 */
export const getMonthlyPhotos = async (
  searchParameters: Record<string, string | string[] | undefined> = {},
  { pageSize }: { pageSize: number },
): Promise<TMonthlyPhotosResult> => {
  const supabase = await createServerClient();
  const size = Math.floor(pageSize);
  const requestedPage = parsePage(searchParameters.page);

  // Свежий builder на каждый вызов: исполненный thenable переиспользовать нельзя.
  // head=true — только count без Range, чтобы клампить страницу до выборки:
  // PostgREST отдаёт 416 на Range за пределами результата.
  const buildRequest = (head = false) =>
    supabase
      .from("routines")
      .select(
        "id, name, start_date, end_date, routine_photos!inner(id, series, slot, image_path)",
        { count: "exact", head },
      )
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false });

  const { count, error: countError } = await buildRequest(true);
  if (countError) {
    throw new Error("Error on get monthly photos", { cause: countError });
  }

  const total = count ?? 0;
  const pageCount = Math.ceil(total / size);
  const page = pageCount > 0 ? Math.min(requestedPage, pageCount) : 1;

  let rows: TRoutineRow[] = [];
  if (total > 0) {
    const from = (page - 1) * size;
    const { data, error } = await buildRequest().range(from, from + size - 1);
    if (error) {
      throw new Error("Error on get monthly photos", { cause: error });
    }
    rows = (data ?? []) as TRoutineRow[];
  }

  const routines = await Promise.all(
    rows.map(async (row) => {
      const photos = row.routine_photos ?? [];
      const thumbUrl = photos.length
        ? ((await fetchSignedImageUrl(
            supabase,
            ROUTINE_PHOTOS_BUCKET,
            pickThumb(photos).image_path,
          )) ?? null)
        : null;

      return {
        routineId: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
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

  const groups = [...byMonth.entries()]
    .map(([monthKey, monthRoutines]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      routines: monthRoutines.sort((left, right) =>
        right.startDate.localeCompare(left.startDate),
      ),
    }))
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));

  return { groups, total, page, pageSize: size, pageCount };
};
