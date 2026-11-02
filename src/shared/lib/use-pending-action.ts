"use client";

import { useState } from "react";

const fallbackErrorMessage = (cause: unknown, fallback: string): string =>
  cause instanceof Error ? cause.message : fallback;

/**
 * Состояние отправки формы: isLoading + error и обёртка run() с единым
 * try/catch/finally. Используется auth-формами (вход, сброс, новый пароль),
 * чтобы не повторять в каждой связку setIsLoading/setError/finally.
 *
 * run() принимает экшен, который при неудаче бросает Error (паттерн
 * `if (error) throw error` у Supabase); текст ошибки извлекается mapError
 * (по умолчанию — message ошибки, иначе fallbackMessage).
 */
export function usePendingAction({
  fallbackMessage,
  mapError = fallbackErrorMessage,
}: {
  fallbackMessage: string;
  mapError?: (cause: unknown, fallbackMessage: string) => string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);

    try {
      await action();
    } catch (cause) {
      setError(mapError(cause, fallbackMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return { error, setError, isLoading, run };
}
