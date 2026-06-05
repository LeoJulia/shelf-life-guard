import { serverSupabaseClient } from "#supabase/server";

export type TFilterOptions = {
  brands: string[];
  categories: string[];
  shops: string[];
  volumes: string[];
};

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  // Получаем уникальные бренды
  const brandsResult = await supabase.rpc("get_brands");

  if (brandsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: brandsResult.error.message,
    });
  }

  // Получаем уникальные категории
  const categoriesResult = await supabase.rpc("get_categories");

  if (categoriesResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: categoriesResult.error.message,
    });
  }

  // Получаем уникальные магазины
  const shopsResult = await supabase.rpc("get_shops");

  if (shopsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: shopsResult.error.message,
    });
  }

  // Получаем уникальные объемы
  const volumesResult = await supabase.rpc("get_volumes");

  if (volumesResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: volumesResult.error.message,
    });
  }

  // Преобразуем данные в массивы уникальных значений
  const brandsArray = Array.from(
    new Set((brandsResult.data.map(({ brand }) => brand) || []) as any[]),
  ).filter(Boolean);

  const categoriesArray = Array.from(
    new Set(
      (categoriesResult.data.map(({ category }) => category) || []) as any[],
    ),
  ).filter(Boolean);

  const shopsArray = Array.from(
    new Set((shopsResult.data.map(({ shop }) => shop) || []) as any[]),
  ).filter(Boolean);

  const volumesArray = Array.from(
    new Set((volumesResult.data.map(({ volume }) => volume) || []) as any[]),
  ).filter(Boolean);

  return {
    brands: brandsArray,
    categories: categoriesArray,
    shops: shopsArray,
    volumes: volumesArray,
  };
});
