"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/shared/api";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const MIN_PASSWORD_LENGTH = 6;

export function ChangePasswordForm({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { error, setError, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось сменить пароль",
  });
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }

    const supabase = createClient();
    setMessage(null);

    void run(async () => {
      // Фаза 1 — reauth: подтверждаем личность текущим паролем.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        throw new Error("Неверный текущий пароль");
      }

      // Фаза 2 — смена пароля.
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      setMessage("Пароль изменён");
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Пароль</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='current-password'>Текущий пароль</Label>
              <Input
                id='current-password'
                type='password'
                required
                autoComplete='current-password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='new-password'>Новый пароль</Label>
              <Input
                id='new-password'
                type='password'
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete='new-password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='new-password-confirm'>
                Повторите новый пароль
              </Label>
              <Input
                id='new-password-confirm'
                type='password'
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete='new-password'
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            {message && (
              <p className='text-sm text-muted-foreground'>{message}</p>
            )}
            <Button type='submit' disabled={isLoading}>
              {isLoading ? "Смена пароля..." : "Сменить пароль"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
