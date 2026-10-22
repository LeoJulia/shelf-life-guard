"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface RatingStarsProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function RatingStars({ value, onChange }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (star: number) => {
    // Повторный клик на ту же звезду снимает рейтинг
    onChange(value === star ? null : star);
  };

  const displayValue = hoverValue ?? value ?? 0;

  return (
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
            className='transition-transform hover:scale-110 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded'
            aria-label={`${star} ${star === 1 ? "звезда" : "звезды"}`}
            aria-checked={value === star}
            role='radio'
          >
            <Star
              className={`transition-colors ${
                isActive ? "fill-primary text-primary" : "fill-muted text-muted"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
