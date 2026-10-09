import type { TProduct } from "@/entities/product";

const DAY_MS = 86_400_000;

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS);

export const getUsedDays = (product: TProduct) => {
  if (!product.opened_at) {
    return undefined;
  }

  const end = product.finished_at ?? new Date().toISOString();
  const days = daysBetween(product.opened_at, end);

  return days > 0 ? days : undefined;
};

export const getUsageDays = (product: TProduct) => {
  if (!product.opened_at || !product.finished_at) {
    return undefined;
  }

  return daysBetween(product.opened_at, product.finished_at);
};
