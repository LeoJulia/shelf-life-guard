"use server";

import { createServerClient } from "@/shared/server";
import { isExpiringSoon, isSpentInYear } from "@/entities/product";

export const getStatistic = async () => {
  const client = await createServerClient();

  // Получаем все продукты для статистики
  const { data: products, error } = await client.from("products").select("*");

  if (error) {
    throw new Error("Error on get statistic", error);
  }

  // Обработка пустого списка
  if (!products || products.length === 0) {
    return {
      total: 0,
      spentYear: 0,
      expiring30Days: 0,
      openedTotal: 0,
    };
  }

  const now = new Date();
  const year = now.getFullYear();

  let total = 0;
  let spentYear = 0;
  let expiring30Days = 0;
  let openedTotal = 0;

  for (const product of products) {
    // Общее количество
    total++;

    // Потрачено за год — покупки, добавленные в этом году (год учёта)
    if (isSpentInYear(product, year)) {
      spentYear += product.actual_price ?? 0;
    }

    // Скоро просрок — истекает в ближайшие 30 календарных дней, включая сегодня
    if (isExpiringSoon(product, now)) {
      expiring30Days++;
    }

    // Всего открыто — есть дата открытия
    if (product.opened_at && !product.finished_at) {
      openedTotal++;
    }
  }

  return {
    total,
    spentYear: Math.round(spentYear * 100) / 100,
    expiring30Days,
    openedTotal,
  };
};
