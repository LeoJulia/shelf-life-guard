import type { TProduct } from "./product-types";

export const productStatusLabels = {
  closed: "Закрыт",
  opened: "Открыт",
  used: "Закончился",
} as const;

export type TProductStatus = keyof typeof productStatusLabels;

export const getProductStatus = (
  product: Pick<TProduct, "opened_at" | "finished_at">,
): TProductStatus => {
  if (product.finished_at) {
    return "used";
  }

  return product.opened_at ? "opened" : "closed";
};

export const productStatusRanks: Record<TProductStatus, number> = {
  closed: 0,
  opened: 1,
  used: 2,
};

export const byFinishedFirst = (
  left: Pick<TProduct, "opened_at" | "finished_at">,
  right: Pick<TProduct, "opened_at" | "finished_at">,
) => productStatusRanks[getProductStatus(right)] - productStatusRanks[getProductStatus(left)];
