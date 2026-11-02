import { SetPasswordForm } from "@/features/set-password";
import { createServerClient } from "@/shared/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export const AuthReset = async () => {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const hasSession = Boolean(data.user);

  return (
    <div className='flex min-h-screen w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        {hasSession ? (
          <SetPasswordForm />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>Ссылка недействительна</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Ссылка сброса пароля истекла или уже использована — запросите
                сброс заново.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
