"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center'>
      <h2 className='text-lg font-semibold text-foreground'>
        Не удалось загрузить продукты
      </h2>
      <p className='text-sm text-muted-foreground'>
        Что-то пошло не так при загрузке списка. Измените запрос или попробуйте
        ещё раз.
      </p>
      <Button onClick={reset}>Повторить</Button>
    </div>
  );
}
