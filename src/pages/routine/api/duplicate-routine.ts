"use server";

import { createServerClient } from "@/shared/server";
import { toLocalDateString } from "@/shared/lib/local-date";
import { redirect } from "next/navigation";
import { revalidateRoutineLists } from "../lib/revalidate";

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

  const { data: routineId, error } = await supabase.rpc("duplicate_routine", {
    p_source_id: sourceId,
    p_start_date: toLocalDateString(),
  });

  if (error || !routineId) {
    throw new Error("Duplicate routine error", { cause: error });
  }

  revalidateRoutineLists();

  redirect(`/routine/${routineId}`);
};
