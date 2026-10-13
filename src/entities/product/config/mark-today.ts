export type TMarkTodayAction = "opened" | "finished";

export const markTodayFields: Record<
  TMarkTodayAction,
  "opened_at" | "finished_at"
> = {
  opened: "opened_at",
  finished: "finished_at",
};

export const markTodayLabels: Record<TMarkTodayAction, string> = {
  opened: "Открыт сегодня",
  finished: "Окончен сегодня",
};

export const markTodayDescriptions: Record<TMarkTodayAction, string> = {
  opened: "Записать дату открытия сегодняшним днём",
  finished: "Записать дату окончания сегодняшним днём",
};
