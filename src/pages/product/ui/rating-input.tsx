"use client";

import { Star, X } from "lucide-react";
import { useState } from "react";

interface InteractiveStarRatingProps {
  defaultValue?: number | null;
  name?: string;
}

export function RatingInput({
  defaultValue,
  name,
}: InteractiveStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [value, setValue] = useState<number | undefined | null>(defaultValue);

  const handleClick = (star: number) => {
    // Повторный клик на ту же звезду снимает рейтинг
    if (value === star) {
      setValue(null);
    } else {
      setValue(star);
    }
  };

  const displayValue = hoverValue ?? value ?? 0;

  return (
    <div>
      {name && <input type='hidden' name={name} value={value ?? ""} />}
      <div className='flex items-center gap-2'>
        <div
          className='flex gap-1'
          onMouseLeave={() => setHoverValue(null)}
          role='radiogroup'
          aria-label='Рейтинг от 1 до 5'
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= displayValue;
            return (
              <button
                key={star}
                type='button'
                onClick={() => handleClick(star)}
                onMouseEnter={() => setHoverValue(star)}
                className='transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 rounded'
                aria-label={`${star} ${star === 1 ? "звезда" : "звезды"}`}
                aria-checked={value === star}
                role='radio'
              >
                <Star
                  className={`transition-colors ${
                    isActive
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <span className='text-sm text-muted-foreground min-w-[3rem]'>
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
