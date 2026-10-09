import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const PAGE_SIZE = 10;

export type TColumnMeta = {
  numeric?: boolean;
  wide?: boolean;
  narrow?: boolean;
};

export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: {} as TColumnMeta,
});

export type TTableFeatures = typeof features;
