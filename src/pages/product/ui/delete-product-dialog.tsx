"use client";

import { useState, useTransition, useCallback } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { useRouter } from "next/navigation";

type TDeleteProductDialogProps = {
  productId: string;
  productName?: string | null;
  trigger: React.ReactNode;
  onDelete?: (id: string) => void;
  onError?: (message: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const DeleteProductDialog = ({
  productId,
  productName,
  trigger,
  onDelete,
  onError,
  open,
  onOpenChange,
}: TDeleteProductDialogProps) => {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange],
  );

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { deleteProduct } =
          await import("@/pages/product/api/delete-product");
        await deleteProduct(productId);
        onDelete?.(productId);
        setOpen(false);
        router.push("/dashboard");
        router.refresh();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Не удалось удалить баночку";
        setError(message);
        onError?.(message);
      }
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='text-left'>
          <div className='flex items-center justify-between'>
            <DrawerTitle className='flex items-center gap-2'>
              <Trash className='size-5 text-destructive' />
              Удалить баночку
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant='ghost' size='icon' className='size-8'>
                <span className='sr-only'>Закрыть</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M18 6 6 18' />
                  <path d='m6 6 12 12' />
                </svg>
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription>
            Вы уверены, что хотите удалить{" "}
            <span className='font-semibold text-foreground'>
              {productName ?? "этот продукт"}
            </span>
            ? Это действие нельзя отменить.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className='flex flex-row gap-2'>
          <DrawerClose asChild>
            <Button type='button' variant='outline' className='flex-1'>
              Отмена
            </Button>
          </DrawerClose>
          <Button
            type='button'
            variant='destructive'
            className='flex-1'
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash className='size-4' />
            {isPending ? "Удаление..." : "Удалить"}
          </Button>
        </DrawerFooter>

        {error && (
          <div className='px-4 pb-4'>
            <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
              {error}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
