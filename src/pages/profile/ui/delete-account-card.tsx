"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/shared/api";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { deleteAccount } from "../api/delete-account";

const CONFIRM_WORD = "УДАЛИТЬ";

export function DeleteAccountCard() {
  const [confirmText, setConfirmText] = useState("");
  const { error, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось удалить аккаунт",
    mapError: () => "Не удалось удалить аккаунт",
  });
  const router = useRouter();

  const handleDelete = () => {
    void run(async () => {
      const completed = await deleteAccount();
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace(
        `/auth/login?account=${completed ? "deleted" : "deleting"}`,
      );
    });
  };

  return (
    <Card className='border-destructive'>
      <CardHeader>
        <CardTitle className='text-xl text-destructive'>Опасная зона</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='delete-confirm'>
              Введите «{CONFIRM_WORD}» для удаления аккаунта
            </Label>
            <Input
              id='delete-confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
            />
          </div>
          {error && <p className='text-sm text-destructive'>{error}</p>}
          <Button
            type='button'
            variant='destructive'
            disabled={confirmText !== CONFIRM_WORD || isLoading}
            onClick={handleDelete}
          >
            {isLoading ? "Удаление..." : "Удалить аккаунт навсегда"}
          </Button>
          <p className='text-xs text-muted-foreground'>
            Будут безвозвратно удалены аккаунт, все продукты, теги, рутины и
            загруженные фотографии.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
