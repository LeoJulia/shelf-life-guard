export const formatMoney = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${value.toFixed(2)} ₽`;
