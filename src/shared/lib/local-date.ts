/**
 * Локальная дата в формате YYYY-MM-DD.
 *
 * Намеренно собирается из локальных частей даты, а не через toISOString(),
 * чтобы «сегодня» не уезжало на день назад в отрицательных часовых поясах.
 */
export const toLocalDateString = (date: Date = new Date()): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
