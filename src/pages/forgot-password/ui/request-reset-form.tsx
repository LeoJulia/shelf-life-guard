"use client";

import { useState } from "react";
import { cn } from "@/shared/utils";
import { createClient } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const RATE_LIMIT_HINT =
  "Слишком много запросов — попробуйте позже (лимит ≈ 2 письма в час)";

export function RequestResetForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Без redirectTo: ссылку на /auth/confirm строит наш шаблон письма.
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage(
        "Письмо отправлено — проверьте почту и папку Спам (лимит ≈ 2 письма в час)",
      );
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : "";
      setError(
        text.includes("rate limit")
          ? RATE_LIMIT_HINT
          : text || "Не удалось отправить письмо",
      );
    } finally {
      setIsLoading(false);
    }
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
