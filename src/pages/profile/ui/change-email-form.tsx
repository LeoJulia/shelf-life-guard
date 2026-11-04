"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/shared/api";
import { usePendingAction } from "@/shared/lib/use-pending-action";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const RATE_LIMIT_HINT =
  "Слишком много запросов — попробуйте позже (лимит ≈ 2 письма в час)";

const mapEmailError = (cause: unknown, fallbackMessage: string): string => {
  const text = cause instanceof Error ? cause.message : "";
  if (text.includes("rate limit")) {
    return RATE_LIMIT_HINT;
  }
  return text || fallbackMessage;
};

/** Стандартный double confirmation flow: письма уходят на старый и новый ящик. */
export function ChangeEmailForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { error, isLoading, run } = usePendingAction({
    fallbackMessage: "Не удалось отправить запрос",
    mapError: mapEmailError,
  });
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setMessage(null);

    void run(async () => {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage(
        "Ссылки для подтверждения отправлены на старый и новый ящики — подтвердите обе (лимит ≈ 2 письма в час)",
      );
      setEmail("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className='flex flex-col gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='new-email'>Новая почта</Label>
          <div className='flex gap-2'>
            <Input
              id='new-email'
              type='email'
              placeholder='m@example.com'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type='submit' disabled={isLoading}>
              {isLoading ? "Отправка..." : "Сменить почту"}
            </Button>
          </div>
        </div>
        {error && <p className='text-sm text-destructive'>{error}</p>}
        {message && (
          <p className='text-sm text-muted-foreground'>{message}</p>
        )}
        <p className='text-xs text-muted-foreground'>
          Почта изменится после подтверждения по ссылкам из двух писем: на
          текущем и новом ящике. Письма приходят со встроенной почты Supabase и
          могут попасть в Спам.
        </p>
      </div>
    </form>
  );
}
