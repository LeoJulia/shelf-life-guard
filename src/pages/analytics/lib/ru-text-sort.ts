import type { SortFn } from "@tanstack/react-table";
import type { TProduct } from "@/entities/product";
import type { TTableFeatures } from "../config/table";

export const ruTextSort: SortFn<TTableFeatures, TProduct> = (
  rowA,
  rowB,
  columnId,
) =>
  String(rowA.getValue(columnId) ?? "").localeCompare(
    String(rowB.getValue(columnId) ?? ""),
    "ru",
  );
