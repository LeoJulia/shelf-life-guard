"use server";

import type { TablesInsert } from "@/shared/model";
import { createServerClient } from "@/shared/server";
import type { TRoutineFormState } from "@/entities/routine";
import { redirect } from "next/navigation";
import {
  getRoutineDatesError,
  parseRoutineFormData,
} from "../lib/parse-routine-form-data";
import { revalidateRoutineLists } from "../lib/revalidate";

/**
 * Возвращает состояние, а не бросает исключение: брошенная из server action
 * ошибка долетает до ErrorBoundary лейаута и показывается как «рутина не
 * найдена». Форма выводит возвращённый текст inline через useActionState.
 */
export const createRoutine = async (
  _prevState: TRoutineFormState,
  formData: FormData,
): Promise<TRoutineFormState> => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return { error: "Требуется вход в аккаунт" };
  }

  const values = parseRoutineFormData(formData);
  const datesError = getRoutineDatesError(values);

  if (datesError) {
    return { error: datesError };
  }

  const newRoutine: TablesInsert<"routines"> = {
    ...values,
    user_id: data.user.id,
  };

  const { data: routine, error } = await supabase
    .from("routines")
    .insert(newRoutine)
    .select()
    .single();

  if (error) {
    return { error: "Не удалось создать рутину" };
  }

  revalidateRoutineLists();

  redirect(`/routine/${routine.id}`);
};
