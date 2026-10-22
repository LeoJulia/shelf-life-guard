import type { TRoutineFormValues } from "@/entities/routine";

const toString = (value: FormDataEntryValue | null): string | null =>
  typeof value === "string" ? value : null;

/** Пустые и состоящие из пробелов поля формы храним как NULL, а не как "". */
const toNullIfBlank = (value: string | null): string | null =>
  value?.trim() ? value : null;

export const parseRoutineFormData = (
  formData: FormData,
): TRoutineFormValues => ({
  name: toNullIfBlank(toString(formData.get("name"))),
  start_date: toString(formData.get("start_date")) ?? "",
  end_date: toNullIfBlank(toString(formData.get("end_date"))),
  notes: toNullIfBlank(toString(formData.get("notes"))),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Серверная валидация дат. Возвращает текст ошибки или null.
 *
 * Не бросает исключение: брошенная из server action ошибка долетает до
 * ErrorBoundary лейаута и показывается как «рутина не найдена», что для
 * ошибки ввода вводит в заблуждение. Форма выводит возвращённый текст
 * inline через useActionState.
 *
 * Дублирует нативную валидацию формы и CHECK routines_dates_order в БД.
 */
export const getRoutineDatesError = (
  values: TRoutineFormValues,
): string | null => {
  if (!DATE_RE.test(values.start_date)) {
    return "Укажите дату начала в формате ДД.ММ.ГГГГ";
  }

  if (values.end_date && !DATE_RE.test(values.end_date)) {
    return "Дата окончания задана некорректно";
  }

  if (values.end_date && values.end_date < values.start_date) {
    return "Дата окончания не может быть раньше даты начала";
  }

  return null;
};
