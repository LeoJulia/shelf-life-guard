"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createServerClient } from "@/shared/server";
import { isInviteAdminEmail } from "@/shared/lib/invite-admin";

export type TInviteFormState = { message: string | null };

const RATE_LIMIT_HINT = "Лимит отправки исчерпан, попробуйте позже";

export const sendInvite = async (
  _prevState: TInviteFormState,
  formData: FormData,
): Promise<TInviteFormState> => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!isInviteAdminEmail(data.user?.email)) {
    return { message: "Недостаточно прав" };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { message: "Введите e-mail" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error?.message.includes("already been registered")) {
    return { message: "Такой пользователь уже есть" };
  }
  if (error) {
    // Фолбэк из плана: inviteUserByEmail упирается в почтовый rate-limit
    // (~2 письма/час), generateLink — нет. Письмо не уходит, но приглашение
    // создаётся/обновляется, и ссылку можно восстановить через generateLink.
    const { error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
    });
    if (linkError) {
      return {
        message: error.message.includes("rate limit")
          ? RATE_LIMIT_HINT
          : error.message,
      };
    }
    revalidatePath("/invites");
    return {
      message: `Приглашение для ${email} создано, но письмо не отправлено — почтовый лимит исчерпан, повторите позже`,
    };
  }

  revalidatePath("/invites");
  return { message: `Приглашение отправлено на ${email}` };
};

// Форма «Отправить повторно» в списке — обычный form action без prevState.
export const resendInvite = async (formData: FormData): Promise<void> => {
  await sendInvite({ message: null }, formData);
};
