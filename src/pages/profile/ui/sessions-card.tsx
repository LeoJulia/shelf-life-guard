"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/shared/api";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { LogoutButton } from "./logout-button";

export function SessionsCard() {
  const [message, setMessage] = useState<string | null>(null);
  const { error, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось выйти на других устройствах",
  });
  const router = useRouter();

  const handleSignOutOthers = () => {
    const supabase = createClient();
    setMessage(null);

    void run(async () => {
      // Текущую сессию не трогает, SIGNED_OUT не fires — редирект не нужен.
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      setMessage("Вы вышли на всех остальных устройствах");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Устройства и выход</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleSignOutOthers}
              disabled={isLoading}
            >
              {isLoading
                ? "Выход на других устройствах..."
                : "Выйти на всех остальных устройствах"}
            </Button>
            <LogoutButton />
          </div>
          {error && <p className='text-sm text-destructive'>{error}</p>}
          {message && (
            <p className='text-sm text-muted-foreground'>{message}</p>
          )}
          <p className='text-xs text-muted-foreground'>
            «Выйти на всех остальных устройствах» завершит сессии везде, кроме
            текущего. «Выход» завершит текущую сессию и вернёт на страницу
            входа.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
