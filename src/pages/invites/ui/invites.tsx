import { Card, CardContent } from "@/shared/ui/card";
import { isCurrentUserInviteAdmin } from "../api/is-current-invite-admin";
import { listInvitedUsers } from "../api/list-users";
import { InviteForm } from "./invite-form";
import { InviteList } from "./invite-list";

export const Invites = async () => {
  if (!(await isCurrentUserInviteAdmin())) {
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
