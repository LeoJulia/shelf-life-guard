"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Save } from "lucide-react";
import { Button } from "@/shared/ui/button";

export const ProductFormFooter = ({ cancelHref }: { cancelHref: string }) => {
  const { pending } = useFormStatus();

  return (
    <div className='flex gap-3'>
      <Button type='submit' disabled={pending}>
        <Save />
        {pending ? "Сохранение..." : "Сохранить"}
      </Button>
      <Link href={cancelHref} aria-disabled={pending} tabIndex={pending ? -1 : undefined}>
        <Button type='button' variant='secondary' disabled={pending}>
          Отмена
        </Button>
      </Link>
    </div>
  );
};
