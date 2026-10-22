"use client";

import { Button } from "@/shared/ui/button";
import {
  timeOfDayLabels,
  timeOfDayOrder,
  type TTimeOfDay,
} from "@/entities/routine";

export const TimeOfDayToggle = ({
  value,
  onChange,
  disabled = false,
}: {
  value: TTimeOfDay;
  onChange: (next: TTimeOfDay) => void;
  disabled?: boolean;
}) => (
  <div
    role='group'
    aria-label='Время применения'
    className='inline-flex gap-0.5 rounded-lg border border-input bg-muted p-0.5'
  >
    {timeOfDayOrder.map((key) => (
      <Button
        key={key}
        type='button'
        size='sm'
        variant={value === key ? "default" : "ghost"}
        aria-pressed={value === key}
        disabled={disabled}
        onClick={() => onChange(key)}
        className='h-7 px-2 text-xs'
      >
        {timeOfDayLabels[key]}
      </Button>
    ))}
  </div>
);
