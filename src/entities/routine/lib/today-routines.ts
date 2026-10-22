import { toLocalDateString } from "@/shared/lib/local-date";
import type { TRoutineItem } from "../model/routine-types";
import { getRoutineStatus, type TRoutineDates } from "../model/routine-status";
import { getRoutineTitle } from "./routine-labels";
import { selectItemsForNow, timeParts, type TTimePart } from "./today-items";
import { getTodayWeekdayKey, type TWeekdayKey } from "./weekday";

/** Рутина с позициями, разделёнными по части суток указанного дня. */
export type TRoutineForToday = {
  id: string;
  title: string;
  byPart: Record<TTimePart, TRoutineItem[]>;
};

export type TTodayRoutines = {
  day: TWeekdayKey;
  routines: TRoutineForToday[];
};

/** Минимум полей рутины для расчёта состава на сегодня; TRoutine ему удовлетворяет. */
type TTodayRoutineSource = TRoutineDates & {
  id: string;
  name: string | null;
  items?: TRoutineItem[];
};

/**
 * Позиции всех идущих рутин на указанный день.
 *
 * День недели и статус считаются по одной дате, чтобы «сегодня» не разъезжалось
 * на границе дня. Запланированные и завершённые отсекаются: в первых средства ещё
 * не наносятся, а у последних позиции на сегодня ничего не означают — курс пройден.
 */
export const getTodayRoutines = (
  routines: TTodayRoutineSource[],
  today: string = toLocalDateString(),
): TTodayRoutines => {
  const day = getTodayWeekdayKey(today);

  return {
    day,
    routines: routines.flatMap((routine) => {
      if (getRoutineStatus(routine, today) !== "active") {
        return [];
      }

      const items = routine.items ?? [];
      const byPart: TRoutineForToday["byPart"] = {
        morning: selectItemsForNow(items, day, "morning"),
        evening: selectItemsForNow(items, day, "evening"),
      };

      if (timeParts.every((part) => byPart[part].length === 0)) {
        return [];
      }

      return [{ id: routine.id, title: getRoutineTitle(routine), byPart }];
    }),
  };
};
