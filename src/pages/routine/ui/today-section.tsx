import { Moon, Sun, type LucideIcon } from "lucide-react";
import {
  getTodayWeekdayKey,
  selectItemsForNow,
  timeParts,
  weekdayFullLabels,
  type TRoutineItem,
  type TTimePart,
} from "@/entities/routine";

const TodayColumn = ({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: TRoutineItem[];
}) => (
  <div className='border-border bg-card rounded-xl border p-3'>
    <div className='text-muted-foreground flex items-center gap-1.5'>
      <Icon className='size-4' />
      <span className='text-xs font-medium uppercase tracking-wide'>
        {title}
      </span>
    </div>
    {items.length === 0 ? (
      <p className='text-muted-foreground mt-2 text-sm'>
        Ничего не запланировано
      </p>
    ) : (
      <ol className='mt-2 flex flex-col gap-1'>
        {items.map((item, index) => (
          <li
            key={item.id}
            className='text-foreground flex items-baseline gap-2 text-sm'
          >
            <span className='text-muted-foreground text-xs tabular-nums'>
              {index + 1}.
            </span>
            <span className='truncate'>
              {item.product
                ? `${item.product.brand} — ${item.product.name}`
                : "—"}
            </span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

const partTitles: Record<TTimePart, string> = {
  morning: "Утром",
  evening: "Вечером",
};

/** «Сегодня утром / вечером» для активной рутины, в порядке применения. */
export const TodaySection = ({ items }: { items: TRoutineItem[] }) => {
  const day = getTodayWeekdayKey();

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-foreground text-sm font-semibold'>
        Сегодня — {weekdayFullLabels[day].toLowerCase()}
      </h2>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        {timeParts.map((part) => (
          <TodayColumn
            key={part}
            title={partTitles[part]}
            icon={part === "morning" ? Sun : Moon}
            items={selectItemsForNow(items, day, part)}
          />
        ))}
      </div>
    </section>
  );
};
