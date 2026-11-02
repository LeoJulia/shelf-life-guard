"use client";

import { useState } from "react";
import { cn } from "@/shared/utils";
import { createClient } from "@/shared/api";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const RATE_LIMIT_HINT =
  "Слишком много запросов — попробуйте позже (лимит ≈ 2 письма в час)";

const mapResetError = (cause: unknown, fallbackMessage: string): string => {
  const text = cause instanceof Error ? cause.message : "";
  if (text.includes("rate limit")) {
    return RATE_LIMIT_HINT;
  }
  return text || fallbackMessage;
};

export function RequestResetForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { error, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось отправить письмо",
    mapError: mapResetError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setMessage(null);

    void run(async () => {
      // Без redirectTo: ссылку на /auth/confirm строит наш шаблон письма.
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage(
        "Письмо отправлено — проверьте почту и папку Спам (лимит ≈ 2 письма в час)",
      );
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Сброс пароля</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Почта</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className='text-sm text-destructive'>{error}</p>}
              {message && (
                <p className='text-sm text-muted-foreground'>{message}</p>
              )}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? "Отправка..." : "Отправить письмо"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
