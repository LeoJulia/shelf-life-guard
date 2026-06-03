import { serverSupabaseClient } from "#supabase/server";

export type TStatistic = {
  total: number;
  spentYear: number;
  expiring30Days: number;
  openedTotal: number;
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // Получаем все продукты для статистики
  const { data: products, error } = await client.from("products").select("*");

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
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
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let total = 0;
  let spentYear = 0;
  let expiring30Days = 0;
  let openedTotal = 0;

  for (const product of products) {
    // Общее количество
    total++;

    // Потрачено за год - продукт открыт и дата окончания в этом году или раньше
    if (product.opened_at && product.finished_at) {
      const openedDate = new Date(product.opened_at);
      const finishedDate = new Date(product.finished_at);

      if (openedDate >= yearStart && finishedDate <= now) {
        spentYear++;
      }
    }

    // Истекает срок годности через 30 дней - дата окончания между сегодня и +30 дней
    if (product.expiry_date) {
      const expiryDate = new Date(product.expiry_date);
      if (expiryDate >= now && expiryDate <= thirtyDaysFromNow) {
        expiring30Days++;
      }
    }

    // Всего открыто - есть дата открытия
    if (product.opened_at) {
      openedTotal++;
    }
  }

  return {
    total,
    spentYear,
    expiring30Days,
    openedTotal,
  };
});
