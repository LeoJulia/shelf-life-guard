import { Suspense } from "react";
import {
  StatisticCards,
  StatisticCardsSkeleton,
} from "@/widgets/statistic-cards";
import { createServerClient } from "@/shared/server";
import { isCurrentUserInviteAdmin } from "../api/is-current-invite-admin";
import { AccountCard } from "./account-card";
import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountCard } from "./delete-account-card";

const EMAIL_BANNERS: Record<string, string> = {
  pending:
    "Смена почты ожидает подтверждения — ссылки отправлены на старый и новый ящики",
  changed: "Почта успешно изменена",
};

export const AccountSection = async ({
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

  const isInviteAdmin = await isCurrentUserInviteAdmin();

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-2xl font-bold'>Аккаунт</h1>

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

      <ChangePasswordForm email={user.email ?? ""} />

      <DeleteAccountCard />
    </div>
  );
};
