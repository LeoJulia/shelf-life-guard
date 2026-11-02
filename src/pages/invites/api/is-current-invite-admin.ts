import { createServerClient } from "@/shared/server";
import { isInviteAdminEmail } from "@/shared/lib/invite-admin";

/** Текущий пользователь — администратор приглашений (проверка по e-mail). */
export async function isCurrentUserInviteAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  return isInviteAdminEmail(data.user?.email);
}
