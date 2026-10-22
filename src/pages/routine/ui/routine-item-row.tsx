"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  pickWeekdayFlags,
  toggleAllWeekdays,
  type TRoutineItem,
  type TTimeOfDay,
  type TWeekdayFlags,
  type TWeekdayKey,
} from "@/entities/routine";
import { updateRoutineItemSchedule } from "../api/update-routine-item-schedule";
import { DeleteRoutineItemDialog } from "./delete-routine-item-dialog";
import { TimeOfDayToggle } from "./time-of-day-toggle";
import { WeekdayPicker } from "./weekday-picker";

export const RoutineItemRow = ({
  item,
  index,
  count,
  onMove,
}: {
  item: TRoutineItem;
  index: number;
  count: number;
  onMove: (index: number, direction: -1 | 1) => void;
}) => {
  const router = useRouter();
  const [timeOfDay, setTimeOfDay] = useState<TTimeOfDay>(item.time_of_day);
  const [days, setDays] = useState<TWeekdayFlags>(() => pickWeekdayFlags(item));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = (nextTime: TTimeOfDay, nextDays: TWeekdayFlags) => {
    setError(null);
    startTransition(async () => {
      const message = await updateRoutineItemSchedule(
        item.id,
        nextTime,
        nextDays,
      );

      if (message) {
        setError(message);
        // Строка на сервере осталась прежней, поэтому возвращаем локальные
        // состояния к ней: иначе кнопка выглядит нажатой, хотя ничего не
        // сохранилось.
        setTimeOfDay(item.time_of_day);
        setDays(pickWeekdayFlags(item));
      }

      router.refresh();
    });
  };

  const handleTimeOfDay = (next: TTimeOfDay) => {
    setTimeOfDay(next);
    save(next, days);
  };

  const handleToggleDay = (key: TWeekdayKey) => {
    const next = { ...days, [key]: !days[key] };

    setDays(next);
    save(timeOfDay, next);
  };

  const handleAllDays = () => {
    const next = toggleAllWeekdays(days);

    setDays(next);
    save(timeOfDay, next);
  };

  const product = item.product;

  return (
    <li className='border-border bg-card rounded-xl border p-2.5'>
      <div className='flex items-center gap-2'>
        {product?.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=''
            width={40}
            height={40}
            className='bg-muted size-10 rounded-lg object-cover'
          />
        ) : (
          <span className='bg-muted size-10 shrink-0 rounded-lg' />
        )}
        <div className='min-w-0 flex-1'>
          <p className='text-foreground truncate text-sm font-medium'>
            {product?.name ?? "—"}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {product?.brand}
          </p>
        </div>
        <div className='flex items-center gap-0.5'>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            disabled={index === 0 || isPending}
            onClick={() => onMove(index, -1)}
            aria-label='Поднять выше'
          >
            <ChevronUp className='size-4' />
          </Button>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            disabled={index === count - 1 || isPending}
            onClick={() => onMove(index, 1)}
            aria-label='Опустить ниже'
          >
            <ChevronDown className='size-4' />
          </Button>
          <DeleteRoutineItemDialog
            itemId={item.id}
            productLabel={
              product ? `${product.brand} — ${product.name}` : "средство"
            }
          />
        </div>
      </div>

      <div className='mt-2 flex flex-wrap items-center gap-2'>
        <TimeOfDayToggle
          value={timeOfDay}
          onChange={handleTimeOfDay}
          disabled={isPending}
        />
        <WeekdayPicker
          days={days}
          onToggle={handleToggleDay}
          onAllDays={handleAllDays}
          disabled={isPending}
        />
      </div>

      {error && (
        <p role='alert' className='text-destructive mt-2 text-sm'>
          {error}
        </p>
      )}
    </li>
  );
};
