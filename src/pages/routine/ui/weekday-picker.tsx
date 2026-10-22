"use client";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";
import {
  isConstantSchedule,
  weekdayKeys,
  weekdayLabels,
  type TWeekdayFlags,
  type TWeekdayKey,
} from "@/entities/routine";

export const WeekdayPicker = ({
  days,
  onToggle,
  onAllDays,
  disabled = false,
}: {
  days: TWeekdayFlags;
  onToggle: (key: TWeekdayKey) => void;
  onAllDays: () => void;
  disabled?: boolean;
}) => {
  const allSelected = isConstantSchedule(days);

  return (
    <div className='flex flex-wrap items-center gap-1'>
      <div
        role='group'
        aria-label='Дни недели'
        className='inline-flex gap-0.5 rounded-lg border border-input bg-muted p-0.5'
      >
        {weekdayKeys.map((key) => (
          <Button
            key={key}
            type='button'
            size='sm'
            variant={days[key] ? "secondary" : "ghost"}
            aria-pressed={days[key]}
            disabled={disabled}
            onClick={() => onToggle(key)}
            className={cn(
              "h-7 w-9 px-0 text-xs",
              !days[key] && "text-muted-foreground",
            )}
          >
            {weekdayLabels[key]}
          </Button>
        ))}
      </div>
      <Button
        type='button'
        size='sm'
        variant={allSelected ? "secondary" : "ghost"}
        aria-pressed={allSelected}
        disabled={disabled}
        onClick={onAllDays}
        className='h-7 px-2 text-xs'
      >
        Все дни
      </Button>
      {allSelected && (
        <span className='bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium'>
          Постоянно
        </span>
      )}
    </div>
  );
};
