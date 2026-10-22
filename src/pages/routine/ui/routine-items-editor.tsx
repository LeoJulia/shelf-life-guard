"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Combobox } from "@/shared/ui/combobox";
import type { TProductOption } from "@/entities/product";
import {
  ALL_WEEKDAYS,
  toggleAllWeekdays,
  type TRoutineItem,
  type TTimeOfDay,
  type TWeekdayFlags,
  type TWeekdayKey,
} from "@/entities/routine";
import { setRoutineItemsOrder } from "../api/set-routine-items-order";
import { upsertRoutineItem } from "../api/upsert-routine-item";
import { RoutineItemRow } from "./routine-item-row";
import { TimeOfDayToggle } from "./time-of-day-toggle";
import { WeekdayPicker } from "./weekday-picker";

export const RoutineItemsEditor = ({
  routineId,
  items,
  productOptions,
}: {
  routineId: string;
  items: TRoutineItem[];
  productOptions: TProductOption[];
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TTimeOfDay>("both");
  const [days, setDays] = useState<TWeekdayFlags>(ALL_WEEKDAYS);

  const usedIds = new Set(items.map((item) => item.product?.id));
  const options = productOptions.filter((option) => !usedIds.has(option.id));
  const labelToId = new Map(
    productOptions.map((option) => [option.label, option.id]),
  );

  const run = (task: () => Promise<string | null>) => {
    setError(null);
    startTransition(async () => {
      const message = await task();

      if (message) {
        setError(message);
      }

      router.refresh();
    });
  };

  const handleAdd = () => {
    const productId = label ? labelToId.get(label) : undefined;

    if (!productId) {
      setError("Выберите средство");
      return;
    }

    run(async () => {
      const message = await upsertRoutineItem(
        routineId,
        productId,
        timeOfDay,
        days,
      );

      if (!message) {
        setLabel(null);
        setTimeOfDay("both");
        setDays(ALL_WEEKDAYS);
      }

      return message;
    });
  };

  const handleToggleAddDay = (key: TWeekdayKey) => {
    setDays({ ...days, [key]: !days[key] });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const ids = items.map((item) => item.id);
    const target = index + direction;

    if (target < 0 || target >= ids.length) {
      return;
    }

    [ids[index], ids[target]] = [ids[target], ids[index]];

    run(() => setRoutineItemsOrder(routineId, ids));
  };

  return (
    <div className='flex flex-col gap-3'>
      <div className='border-border rounded-xl border border-dashed p-3'>
        <p className='text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide'>
          Добавить средство
        </p>
        <div className='flex flex-col gap-2'>
          <Combobox
            defaultOptions={options.map((option) => option.label)}
            value={label ? [label] : []}
            onValueChange={(values) => setLabel(values[0] ?? null)}
            placeholder='Выберите баночку из каталога...'
          />
          <div className='flex flex-wrap items-center gap-2'>
            <TimeOfDayToggle
              value={timeOfDay}
              onChange={setTimeOfDay}
              disabled={isPending}
            />
            <WeekdayPicker
              days={days}
              onToggle={handleToggleAddDay}
              onAllDays={() => setDays(toggleAllWeekdays(days))}
              disabled={isPending}
            />
          </div>
          <div>
            <Button type='button' onClick={handleAdd} disabled={isPending}>
              <Plus />
              Добавить в рутину
            </Button>
          </div>
          {error && (
            <p role='alert' className='text-destructive text-sm'>
              {error}
            </p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          В рутине пока нет средств.
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {items.map((item, index) => (
            <RoutineItemRow
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              onMove={handleMove}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
