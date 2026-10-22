"use server";

import { createServerClient } from "@/shared/server";
import { toLocalDateString } from "@/shared/lib/local-date";
import { revalidateRoutine } from "../lib/revalidate";

/**
 * Завершает рутину сегодняшней датой. Без редиректа: вызывающая кнопка
 * остаётся на странице и делает router.refresh().
 */
export const finishRoutine = async (id: string) => {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("routines")
    .update({ end_date: toLocalDateString() })
    .eq("id", id);

  if (error) {
    throw new Error("Finish routine error", { cause: error });
  }

  revalidateRoutine(id);
};
