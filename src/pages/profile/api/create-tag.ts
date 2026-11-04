"use server";

import { createServerClient } from "@/shared/server";
import { generatePastelColor } from "@/entities/tag";
import { revalidateTags } from "../lib/revalidate";

export type TTagFormState = { message: string | null };

export const createTag = async (
  _prevState: TTagFormState,
  formData: FormData,
): Promise<TTagFormState> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Не удалось создать тег" };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { message: "Введите название тега" };
  }

  const { data: existing, error: listError } = await supabase
    .from("tags")
    .select("name")
    .eq("user_id", user.id);

  if (listError) {
    return { message: "Не удалось создать тег" };
  }

  const key = name.toLowerCase();
  if ((existing ?? []).some((tag) => tag.name.toLowerCase() === key)) {
    return { message: "Такой тег уже есть" };
  }

  const { error } = await supabase.from("tags").insert({
    name,
    user_id: user.id,
    color: generatePastelColor(),
  });

  if (error) {
    return { message: "Не удалось создать тег" };
  }

  revalidateTags();
  return { message: `Тег «${name}» добавлен` };
};
