import { redirect } from "next/navigation";
import { isCurrentUserInviteAdmin } from "../api/is-current-invite-admin";
import { listInvitedUsers } from "../api/list-users";
import { InviteForm } from "./invite-form";
import { InviteList } from "./invite-list";

export const InvitesSection = async () => {
  if (!(await isCurrentUserInviteAdmin())) {
    redirect("/profile/account");
  }

  const invitedEntries = await listInvitedUsers();

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Приглашения</h1>
      <InviteForm />
      <InviteList entries={invitedEntries ?? []} />
    </div>
  );
};
