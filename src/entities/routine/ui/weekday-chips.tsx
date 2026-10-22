import { cn } from "@/shared/utils";
import {
  weekdayKeys,
  weekdayLabels,
  type TWeekdayFlags,
} from "../lib/weekday";

/** Read-only полоса Пн…Вс: включённые дни подсвечены, выключенные приглушены. */
export const WeekdayChips = ({
  days,
  className,
}: {
  days: TWeekdayFlags;
  className?: string;
}) => (
  <span className={cn("inline-flex gap-1", className)}>
    {weekdayKeys.map((key) => (
      <span
        key={key}
        aria-hidden={!days[key]}
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          days[key]
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground/50",
        )}
      >
        {weekdayLabels[key]}
      </span>
    ))}
  </span>
);
