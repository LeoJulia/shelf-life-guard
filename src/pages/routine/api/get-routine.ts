import { createServerClient } from "@/shared/server";
import type { TRoutine } from "@/entities/routine";
import {
  mapRoutineRow,
  signRoutineImages,
  type TRoutineRow,
} from "../lib/map-routine";

/** Рутина целиком: позиции со средствами, фотографии и подписанные URL картинок. */
export const getRoutine = async (id: string): Promise<TRoutine> => {
  if (!id) {
    throw new Error("Not provided routine id");
  }

  const supabase = await createServerClient();

  const select =
    "*, routine_items(*, products(id, name, brand, image_path)), routine_photos(*)";

  const { data, error } = await supabase
    .from("routines")
    .select(select)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Error during get routine", { cause: error });
  }

  return signRoutineImages(supabase, mapRoutineRow(data as TRoutineRow));
};
