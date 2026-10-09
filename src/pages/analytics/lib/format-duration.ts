import { intervalToDuration } from "date-fns";

export const formatDuration = (start: string, end: string) => {
  const { years = 0, months = 0, days = 0 } = intervalToDuration({
    start: new Date(start),
    end: new Date(end),
  });

  const parts = [
    years ? `${years}г` : "",
    months ? `${months}м` : "",
    days ? `${days}д` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : "0д";
};
