import { cache } from "react";
import { createServerClient } from "@/shared/server";
import { isInviteAdminEmail } from "@/shared/lib/invite-admin";

/**
 * Текущий пользователь — администратор приглашений (проверка по e-mail).
 *
 * Обёрнуто в React cache(): вызов дедуплицируется в пределах одного запроса,
 * т.к. проверка нужна и layout'у (для sidebar), и разделу приглашений.
 */
export const isCurrentUserInviteAdmin = cache(
  async (): Promise<boolean> => {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getUser();
    return isInviteAdminEmail(data.user?.email);
  },
);
