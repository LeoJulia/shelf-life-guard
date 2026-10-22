import { formatDate } from "@/shared/lib/format-date";

/** Название рутины с откатом на дату начала, если пользователь его не задал. */
export const getRoutineTitle = (routine: {
  name: string | null;
  start_date: string;
}): string => {
  const name = routine.name?.trim();

  return name || `Рутина с ${formatDate(routine.start_date) ?? "—"}`;
};

/** «12 мар 2026 г. — 5 апр 2026 г.» или «с 12 мар 2026 г.», если рутина идёт. */
export const formatRoutineRange = (routine: {
  start_date: string;
  end_date: string | null;
}): string => {
  const start = formatDate(routine.start_date) ?? "—";
  const end = formatDate(routine.end_date);

  return end ? `${start} — ${end}` : `с ${start}`;
};
