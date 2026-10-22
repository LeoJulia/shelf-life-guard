/**
 * Форматирует дату в короткий русский вид: "12 мар 2026 г.".
 *
 * Ожидает строку YYYY-MM-DD (колонки типа date). Date собирается из локальных
 * частей, а не через new Date(iso): строка YYYY-MM-DD парсится как UTC и в
 * отрицательных часовых поясах показывает предыдущий день.
 */
export const formatDate = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("ru-RU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
