import { SetPasswordForm } from "@/features/set-password";
import { hasSession } from "@/shared/server";
import { AuthScreen, InvalidLinkCard } from "@/shared/ui/auth-screen";

export const AuthInvite = async () => {
  const sessionActive = await hasSession();

  return (
    <AuthScreen>
      {sessionActive ? (
        <>
          <h1 className='mb-4 text-center text-lg font-medium'>
            Приглашение принято — задайте пароль
          </h1>
          <SetPasswordForm />
        </>
      ) : (
        <InvalidLinkCard>
          Ссылка приглашения истекла или уже использована — попросите владельца
          выслать приглашение заново.
        </InvalidLinkCard>
      )}
    </AuthScreen>
  );
};
