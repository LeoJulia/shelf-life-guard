"use server";

import type { Tables, TablesInsert } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import { toLocalDateString } from "@/shared/lib/local-date";
import { redirect } from "next/navigation";
import { revalidateRoutineLists } from "../lib/revalidate";

type TSourceItem = Tables<"routine_items">;

/**
 * Копирует только состав рутины: средства, пометки утро/вечер, дни недели
 * и порядок. Фотографии и комментарий не копируются, даты очищаются
 * (начало = сегодня, конец пуст) — см. требования к копированию.
 */
export const duplicateRoutine = async (sourceId: string) => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Duplicate routine error: user is not authenticated");
  }

  const { data: source, error } = await supabase
    .from("routines")
    .select("*, routine_items(*)")
    .eq("id", sourceId)
    .single();

  if (error) {
    throw new Error("Duplicate routine error: source not found", {
      cause: error,
    });
  }

  const newRoutine: TablesInsert<"routines"> = {
    user_id: data.user.id,
    name: source.name ? `${source.name} (копия)` : null,
    start_date: toLocalDateString(),
    end_date: null,
    notes: null,
    copied_from: sourceId,
  };

  const { data: created, error: createError } = await supabase
    .from("routines")
    .insert(newRoutine)
    .select()
    .single();

  if (createError) {
    throw new Error("Duplicate routine error", { cause: createError });
  }

  const items: TablesInsert<"routine_items">[] = (
    (source.routine_items ?? []) as TSourceItem[]
  ).map((item) => ({
    routine_id: created.id,
    user_id: data.user!.id,
    product_id: item.product_id,
    time_of_day: item.time_of_day,
    is_constant: item.is_constant,
    mon: item.mon,
    tue: item.tue,
    wed: item.wed,
    thu: item.thu,
    fri: item.fri,
    sat: item.sat,
    sun: item.sun,
    position: item.position,
  }));

  if (items.length) {
    const { error: itemsError } = await supabase
      .from("routine_items")
      .insert(items);

    if (itemsError) {
      throw new Error("Duplicate routine items error", { cause: itemsError });
    }
  }

  revalidateRoutineLists();

  redirect(`/routine/${created.id}`);
};
