"use server";

import { createServerClient } from "@/shared/server";
import { toLocalDateString } from "@/shared/lib/local-date";

/**
 * Агрегаты статистики считает БД (RPC get_product_statistics), а не выборка
 * всех продуктов в JS: обычный select молча обрезается на лимите Data API
 * (max_rows = 1000) и занижает итоги, когда продуктов становится больше.
 *
 * Семантика совпадает с чистыми функциями entities/product/lib (isSpentInYear,
 * isExpiringSoon). p_year и p_today передаются с сервера, чтобы граница года и
 * «сегодня» совпадали с JS-календарём независимо от часового пояса базы.
 */
export const getStatistic = async () => {
  const client = await createServerClient();
  const now = new Date();

  const { data, error } = await client.rpc("get_product_statistics", {
    p_year: now.getFullYear(),
    p_today: toLocalDateString(now),
  });

  if (error) {
    throw new Error("Error on get statistic", { cause: error });
  }

  const row = data?.[0];

  return {
    total: Number(row?.total ?? 0),
    spentYear: Math.round(Number(row?.spent_year ?? 0) * 100) / 100,
    expiring30Days: Number(row?.expiring_30_days ?? 0),
    openedTotal: Number(row?.opened_total ?? 0),
  };
};
