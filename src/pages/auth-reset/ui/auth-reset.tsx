import { SetPasswordForm } from "@/features/set-password";
import { hasSession } from "@/shared/server";
import { AuthScreen, InvalidLinkCard } from "@/shared/ui/auth-screen";

export const AuthReset = async () => {
  const sessionActive = await hasSession();

  return (
    <AuthScreen>
      {sessionActive ? (
        <SetPasswordForm />
      ) : (
        <InvalidLinkCard>
          Ссылка сброса пароля истекла или уже использована — запросите сброс
          заново.
        </InvalidLinkCard>
      )}
    </AuthScreen>
  );
};
