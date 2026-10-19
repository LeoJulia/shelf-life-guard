"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { RatingStars } from "./rating-stars";

interface InteractiveStarRatingProps {
  defaultValue?: number | null;
  name?: string;
}

export function RatingInput({
  defaultValue,
  name,
}: InteractiveStarRatingProps) {
  const [value, setValue] = useState<number | undefined | null>(defaultValue);

  return (
    <div>
      {name && <input type='hidden' name={name} value={value ?? ""} />}
      <div className='flex items-center gap-2'>
        <RatingStars
          value={value ?? null}
          onChange={(next) => setValue(next)}
        />

        <span className='text-sm text-muted-foreground min-w-12'>
          {value ? `${value} / 5` : "нет оценки"}
        </span>

        {value !== null && (
          <button
            type='button'
            onClick={() => setValue(null)}
            className='ml-2 text-xs text-muted-foreground hover:text-destructive-foreground transition-colors flex items-center gap-1'
            aria-label='Сбросить рейтинг'
          >
            <X className='w-3.5 h-3.5' />
            Сбросить
          </button>
        )}
      </div>
      <p className='text-xs text-muted-foreground mt-1'>
        Повторный клик по звезде снимает оценку
      </p>
    </div>
  );
}
