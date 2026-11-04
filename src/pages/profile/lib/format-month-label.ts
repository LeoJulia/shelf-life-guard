/**
 * Подпись месяца из ключа "YYYY-MM" в русском виде: "Октябрь 2026".
 *
 * Date собирается из локальных частей (как в formatDate), а не через
 * new Date(iso): строка YYYY-MM парсится как UTC и в отрицательных часовых
 * поясах может показать предыдущий месяц.
 */
export const formatMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split("-").map(Number);

  const label = new Date(year, month - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  return (label.charAt(0).toUpperCase() + label.slice(1)).replace(/ г\.$/, "");
};
