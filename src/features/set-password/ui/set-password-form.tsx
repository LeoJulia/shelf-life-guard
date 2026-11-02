"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/shared/utils";
import { createClient } from "@/shared/api";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const MIN_PASSWORD_LENGTH = 6;

export function SetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const { error, setError, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось сохранить пароль",
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

    void run(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/dashboard");
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Новый пароль</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='password'>Пароль</Label>
                <Input
                  id='password'
                  type='password'
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password-confirm'>Повторите пароль</Label>
                <Input
                  id='password-confirm'
                  type='password'
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </div>
              {error && <p className='text-sm text-destructive'>{error}</p>}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить пароль"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
