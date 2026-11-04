import { Suspense } from "react";
import { StatisticCards, StatisticCardsSkeleton } from "@/widgets/statistic-cards";
import { getTagsWithColors } from "@/entities/tag";
import { createServerClient } from "@/shared/server";
import { isCurrentUserInviteAdmin } from "../api/is-current-invite-admin";
import { listInvitedUsers } from "../api/list-users";
import { AccountCard } from "./account-card";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountCard } from "./delete-account-card";
import { InviteForm } from "./invite-form";
import { InviteList } from "./invite-list";
import { SessionsCard } from "./sessions-card";
import { TagsCard } from "./tags-card";

const EMAIL_BANNERS: Record<string, string> = {
  pending:
    "Смена почты ожидает подтверждения — ссылки отправлены на старый и новый ящики",
  changed: "Почта успешно изменена",
};

export const Profile = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const emailBanner =
    typeof params?.email === "string" ? EMAIL_BANNERS[params.email] : undefined;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [tags, isInviteAdmin, invitedEntries] = await Promise.all([
    getTagsWithColors(),
    isCurrentUserInviteAdmin(),
    listInvitedUsers(),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Кабинет</h1>

      {emailBanner && (
        <div className='rounded-lg border bg-card p-3 text-sm text-foreground'>
          {emailBanner}
        </div>
      )}

      <AccountCard
        email={user.email ?? ""}
        newEmail={user.new_email ?? null}
        isInviteAdmin={isInviteAdmin}
      />

      <section className='flex flex-col gap-3'>
        <h2 className='text-xl font-semibold'>Статистика</h2>
        <Suspense fallback={<StatisticCardsSkeleton />}>
          <StatisticCards />
        </Suspense>
      </section>

      <TagsCard tags={tags} />

      <ChangePasswordForm email={user.email ?? ""} />

      <SessionsCard />

      {isInviteAdmin && (
        <section className='flex flex-col gap-3'>
          <h2 className='text-xl font-semibold'>Приглашения</h2>
          <InviteForm />
          <InviteList entries={invitedEntries ?? []} />
        </section>
      )}

      <DeleteAccountCard />
    </div>
  );
};
