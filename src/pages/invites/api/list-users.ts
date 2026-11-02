import { createAdminClient, createServerClient } from "@/shared/server";
import { isInviteAdminEmail } from "@/shared/lib/invite-admin";

export type TInviteListEntry = {
  email: string;
  status: "invited" | "accepted";
};

export async function listInvitedUsers(): Promise<TInviteListEntry[] | null> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!isInviteAdminEmail(data.user?.email)) {
    return null;
  }

  const admin = createAdminClient();
  const { data: usersData, error } = await admin.auth.admin.listUsers();
  if (error) {
    return null;
  }

  return usersData.users
    .map((user): TInviteListEntry => ({
      email: user.email ?? "",
      status: user.email_confirmed_at ? "accepted" : "invited",
    }))
    .filter((entry) => entry.email);
}
