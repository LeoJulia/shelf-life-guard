"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createServerClient } from "@/shared/server";
import { isCurrentUserInviteAdmin } from "./is-current-invite-admin";

export type TChangeEmailAdminState = { message: string | null };

// Эскалация «потерял доступ к старой почте»: доступна только админу приглашений.
// ВАЖНО: isCurrentUserInviteAdmin() сверяет ТЕКУЩИЙ email из claims с
// INVITE_ADMIN_EMAILS. После смены email адрес в env может разъехаться с
// фактическим — при необходимости обновить INVITE_ADMIN_EMAILS.
export const changeEmailAdmin = async (
  _prevState: TChangeEmailAdminState,
  formData: FormData,
): Promise<TChangeEmailAdminState> => {
  if (!(await isCurrentUserInviteAdmin())) {
    return { message: "Недостаточно прав" };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Не удалось сменить почту" };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { message: "Введите новый e-mail" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/profile");
  return { message: `Почта изменена на ${email}` };
};
