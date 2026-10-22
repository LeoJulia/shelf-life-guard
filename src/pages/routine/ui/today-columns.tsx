import { Moon, Sun, type LucideIcon } from "lucide-react";
import { timeParts, type TRoutineItem, type TTimePart } from "@/entities/routine";

const partTitles: Record<TTimePart, string> = {
  morning: "Утром",
  evening: "Вечером",
};

const partIcons: Record<TTimePart, LucideIcon> = {
  morning: Sun,
  evening: Moon,
};

/** Колонка средств одной части суток, в порядке применения. */
const TodayColumn = ({
  part,
  items,
}: {
  part: TTimePart;
  items: TRoutineItem[];
}) => {
  const Icon = partIcons[part];

  return (
    <div className='border-border bg-card rounded-xl border p-3'>
      <div className='text-muted-foreground flex items-center gap-1.5'>
        <Icon className='size-4' />
        <span className='text-xs font-medium uppercase tracking-wide'>
          {partTitles[part]}
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
};

/** Сетка «утро / вечер» для одной рутины. */
export const TodayColumns = ({
  byPart,
}: {
  byPart: Record<TTimePart, TRoutineItem[]>;
}) => (
  <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
    {timeParts.map((part) => (
      <TodayColumn key={part} part={part} items={byPart[part]} />
    ))}
  </div>
);
