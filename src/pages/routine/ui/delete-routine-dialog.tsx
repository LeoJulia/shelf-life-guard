"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

export const DeleteRoutineDialog = ({
  routineId,
  routineName,
  trigger,
}: {
  routineId: string;
  routineName?: string | null;
  trigger: React.ReactNode;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const { deleteRoutine } =
          await import("@/pages/routine/api/delete-routine");
        await deleteRoutine(routineId);
        setIsOpen(false);
        router.push("/routine");
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Не удалось удалить рутину",
        );
      }
    });
  }, [routineId, router]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='text-left'>
          <div className='flex items-center justify-between'>
            <DrawerTitle className='flex items-center gap-2'>
              <Trash className='size-5 text-destructive' />
              Удалить рутину
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
              {routineName ?? "эту рутину"}
            </span>
            ? Вместе с ней удалятся состав и фотографии. Это действие нельзя
            отменить.
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
