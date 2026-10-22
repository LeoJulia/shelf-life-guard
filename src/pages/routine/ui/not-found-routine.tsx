"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bug } from "lucide-react";
import { Button } from "@/shared/ui/button";

export const NotFoundRoutine = ({
  error,
}: {
  error: Error & { digest?: string };
}) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='mt-12 flex flex-col items-center justify-center text-center'>
      <Bug className='h-12 w-12 text-primary' />
      <h3 className='mt-4 text-lg font-medium text-foreground'>
        Упс... Ошибочка
      </h3>
      <p className='mt-1 mb-1 text-muted-foreground'>
        Возможно это временная ошибка. Или рутины не существовало, а может она
        была удалена. Попробуйте открыть другую или создать новую.
      </p>
      <Link href='/routine' className='mt-3'>
        <Button>К списку рутин</Button>
      </Link>
    </div>
  );
};
