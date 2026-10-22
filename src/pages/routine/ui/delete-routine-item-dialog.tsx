"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
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
import { deleteRoutineItem } from "../api/delete-routine-item";

export const DeleteRoutineItemDialog = ({
  itemId,
  productLabel,
}: {
  itemId: string;
  productLabel: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const message = await deleteRoutineItem(itemId);

      if (message) {
        setError(message);
        return;
      }

      setIsOpen(false);
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          aria-label='Удалить средство из рутины'
          className='text-muted-foreground hover:text-destructive'
        >
          <Trash2 className='size-4' />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='text-left'>
          <DrawerTitle className='flex items-center gap-2'>
            <Trash2 className='size-5 text-destructive' />
            Убрать из рутины
          </DrawerTitle>
          <DrawerDescription>
            Убрать{" "}
            <span className='font-semibold text-foreground'>
              {productLabel}
            </span>{" "}
            из состава рутины? Сама баночка не пострадает.
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
            <Trash2 className='size-4' />
            {isPending ? "Убираем..." : "Убрать"}
          </Button>
        </DrawerFooter>

        {error && (
          <div className='px-4 pb-4'>
            <div
              role='alert'
              className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'
            >
              {error}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
