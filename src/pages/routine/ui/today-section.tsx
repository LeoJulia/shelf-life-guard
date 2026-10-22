import {
  getTodayWeekdayKey,
  selectItemsForNow,
  weekdayFullLabels,
  type TRoutineItem,
  type TTimePart,
} from "@/entities/routine";
import { TodayColumns } from "./today-columns";

/** «Сегодня утром / вечером» для активной рутины, в порядке применения. */
export const TodaySection = ({ items }: { items: TRoutineItem[] }) => {
  const day = getTodayWeekdayKey();
  const byPart: Record<TTimePart, TRoutineItem[]> = {
    morning: selectItemsForNow(items, day, "morning"),
    evening: selectItemsForNow(items, day, "evening"),
  };

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-foreground text-sm font-semibold'>
        Сегодня — {weekdayFullLabels[day].toLowerCase()}
      </h2>
      <TodayColumns byPart={byPart} />
    </section>
  );
};
