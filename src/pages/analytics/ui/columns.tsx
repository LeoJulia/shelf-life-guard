import { createColumnHelper } from "@tanstack/react-table";
import {
  getProductStatus,
  productStatusRanks,
  type TProduct,
} from "@/entities/product/model";
import { ProductStatusIcon } from "@/entities/product/ui";
import { type TTableFeatures } from "../config/table";
import { formatMoney } from "../lib/format-money";
import { formatDuration } from "../lib/format-duration";
import { pricePerDays } from "../lib/price-per-days";
import { getUsageDays, getUsedDays } from "../lib/product-days";
import { ruTextSort } from "../lib/ru-text-sort";

const helper = createColumnHelper<TTableFeatures, TProduct>();

export const columns = helper.columns([
  helper.accessor((product) => productStatusRanks[getProductStatus(product)], {
    id: "status",
    header: "Статус",
    cell: (context) => <ProductStatusIcon product={context.row.original} />,
  }),
  helper.accessor((product) => product.brand ?? undefined, {
    id: "brand",
    header: "Бренд",
    sortFn: ruTextSort,
    sortUndefined: "last",
    cell: (context) => context.getValue() ?? "—",
  }),
  helper.accessor((product) => product.name, {
    id: "name",
    header: "Название",
    sortFn: ruTextSort,
    meta: { wide: true },
  }),
  helper.accessor((product) => getUsageDays(product), {
    id: "used_days",
    header: "Срок использования",
    sortUndefined: "last",
    meta: { numeric: true, narrow: true },
    cell: (context) => {
      const product = context.row.original;

      if (!product.opened_at || !product.finished_at) {
        return "—";
      }

      return formatDuration(product.opened_at, product.finished_at);
    },
  }),
  helper.accessor((product) => product.market_price ?? undefined, {
    id: "market_price",
    header: "Рыночная стоимость",
    sortUndefined: "last",
    meta: { numeric: true },
    cell: (context) => formatMoney(context.getValue()),
  }),
  helper.accessor((product) => product.actual_price ?? undefined, {
    id: "actual_price",
    header: "Стоимость покупки",
    sortUndefined: "last",
    meta: { numeric: true },
    cell: (context) => formatMoney(context.getValue()),
  }),
  helper.accessor(
    (product) => pricePerDays(product.market_price, getUsedDays(product), 1),
    {
      id: "market_per_day",
      header: "Цена за 1 день (рыночная)",
      sortUndefined: "last",
      meta: { numeric: true },
      cell: (context) => formatMoney(context.getValue()),
    },
  ),
  helper.accessor(
    (product) => pricePerDays(product.actual_price, getUsedDays(product), 1),
    {
      id: "actual_per_day",
      header: "Цена за 1 день (фактическая)",
      sortUndefined: "last",
      meta: { numeric: true, narrow: true },
      cell: (context) => formatMoney(context.getValue()),
    },
  ),
  helper.accessor(
    (product) => pricePerDays(product.market_price, getUsedDays(product), 30),
    {
      id: "market_per_30_days",
      header: "Цена за 30 дней (рыночная)",
      sortUndefined: "last",
      meta: { numeric: true },
      cell: (context) => formatMoney(context.getValue()),
    },
  ),
  helper.accessor(
    (product) => pricePerDays(product.actual_price, getUsedDays(product), 30),
    {
      id: "actual_per_30_days",
      header: "Цена за 30 дней (фактическая)",
      sortUndefined: "last",
      meta: { numeric: true },
      cell: (context) => formatMoney(context.getValue()),
    },
  ),
]);
