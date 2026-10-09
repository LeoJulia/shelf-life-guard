import type { TProduct } from "@/entities/product";

const DAY_MS = 86_400_000;

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS);

export const getShelfDays = (product: TProduct) => {
  const start = product.opened_at ?? product.created_at;

  if (!start || !product.expiry_date) {
    return undefined;
  }

  const days = daysBetween(start, product.expiry_date);

  return days > 0 ? days : undefined;
};

export const getUsedDays = (product: TProduct) => {
  if (!product.opened_at) {
    return undefined;
  }

  const end = product.finished_at ?? new Date().toISOString();

  return Math.max(1, daysBetween(product.opened_at, end));
};
