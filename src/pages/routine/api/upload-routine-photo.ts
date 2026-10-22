"use server";

import type { TablesInsert } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import { uploadBase64Image } from "@/shared/lib/upload-image";
import { ROUTINE_PHOTOS_BUCKET } from "@/shared/lib/buckets";
import { isPhotoSeries, isPhotoSlot } from "@/entities/routine";
import { revalidateRoutine } from "../lib/revalidate";
import { routineOwnedByCurrentUser } from "../lib/routine-ownership";

const BASE64_IMAGE_RE = /^data:image\/[^;]+;base64,/;

/**
 * Загружает фото в один слот: одна серия × один ракурс = один вызов.
 *
 * По одному фото за вызов, а не пачкой: лимит тела server action в Next.js —
 * 1 МБ, а сжатый webp ≤0.5 МБ в base64 даёт ≈670 КБ. Четырнадцать фото одной
 * формой дали бы около 9 МБ.
 *
 * Каждый объект получает свежий uuid-путь, поэтому в Storage нет upsert:
 * старый объект удаляется после успешной перезаписи строки.
 *
 * @returns текст ошибки или null при успехе
 */
export const uploadRoutinePhoto = async (
  formData: FormData,
): Promise<string | null> => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return "Требуется вход в аккаунт";
  }

  const routineId = formData.get("routine_id");
  const seriesRaw = formData.get("series");
  const slotRaw = formData.get("slot");
  const photo = formData.get("photo");

  if (typeof routineId !== "string" || !routineId) {
    return "Не указана рутина";
  }

  if (typeof seriesRaw !== "string" || !isPhotoSeries(seriesRaw)) {
    return "Неизвестная серия фото";
  }

  if (typeof slotRaw !== "string" || !isPhotoSlot(slotRaw)) {
    return "Неизвестный ракурс";
  }

  if (typeof photo !== "string" || !BASE64_IMAGE_RE.test(photo)) {
    return "Выберите изображение";
  }

  if (!(await routineOwnedByCurrentUser(supabase, routineId))) {
    return "Рутина не найдена";
  }

  const { data: existing } = await supabase
    .from("routine_photos")
    .select("id, image_path")
    .eq("routine_id", routineId)
    .eq("series", seriesRaw)
    .eq("slot", slotRaw)
    .maybeSingle();

  const path = await uploadBase64Image(
    supabase,
    ROUTINE_PHOTOS_BUCKET,
    formData,
    "photo",
    [routineId],
  );

  if (!path) {
    return "Не удалось загрузить изображение";
  }

  const row: TablesInsert<"routine_photos"> = {
    routine_id: routineId,
    user_id: data.user.id,
    series: seriesRaw,
    slot: slotRaw,
    image_path: path,
  };

  const { error } = await supabase
    .from("routine_photos")
    .upsert(row, { onConflict: "routine_id,series,slot" });

  if (error) {
    await supabase.storage.from(ROUTINE_PHOTOS_BUCKET).remove([path]);
    return "Не удалось сохранить фото";
  }

  if (existing) {
    await supabase.storage
      .from(ROUTINE_PHOTOS_BUCKET)
      .remove([existing.image_path]);
  }

  revalidateRoutine(routineId);

  return null;
};
