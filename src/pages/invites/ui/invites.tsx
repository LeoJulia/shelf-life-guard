import { Card, CardContent } from "@/shared/ui/card";
import { createServerClient } from "@/shared/server";
import { isInviteAdminEmail } from "@/shared/lib/invite-admin";
import { listInvitedUsers } from "../api/list-users";
import { InviteForm } from "./invite-form";
import { InviteList } from "./invite-list";

export const Invites = async () => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  if (!isInviteAdminEmail(data.user?.email)) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-sm text-muted-foreground'>Недостаточно прав</p>
        </CardContent>
      </Card>
    );
  }

  const entries = (await listInvitedUsers()) ?? [];

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Приглашения</h1>
      <InviteForm />
      <InviteList entries={entries} />
    </div>
  );
};
