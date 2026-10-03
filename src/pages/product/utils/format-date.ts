export const formatProductDate = (value?: string | null): string | null =>
  value
    ? new Date(value).toLocaleDateString("ru-RU", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
