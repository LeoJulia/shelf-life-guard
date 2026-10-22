"use server";

import { createServerClient } from "@/shared/server";
import type { TRoutineFormState } from "@/entities/routine";
import { redirect } from "next/navigation";
import { revalidateRoutine } from "../lib/revalidate";
import {
  getRoutineDatesError,
  parseRoutineFormData,
} from "../lib/parse-routine-form-data";

export const updateRoutine = async (
  id: string,
  _prevState: TRoutineFormState,
  formData: FormData,
): Promise<TRoutineFormState> => {
  const supabase = await createServerClient();

  const values = parseRoutineFormData(formData);
  const datesError = getRoutineDatesError(values);

  if (datesError) {
    return { error: datesError };
  }

  const { error } = await supabase
    .from("routines")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: "Не удалось сохранить рутину" };
  }

  revalidateRoutine(id);

  redirect(`/routine/${id}`);
};
