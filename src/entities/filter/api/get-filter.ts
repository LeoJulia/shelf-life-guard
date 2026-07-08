import { createServerClient } from "@/shared/server";

export type TFilterOptions = {
  brands: string[];
  categories: string[];
  shops: string[];
  volumes: string[];
};

export const getBrandsList = async () => {
  const supabase = await createServerClient();

  // Получаем уникальные бренды
  const brandsResult = await supabase.rpc("get_brands");

  if (brandsResult.error) {
    throw new Error("Error get brands", brandsResult.error);
  }

  // Преобразуем данные в массивы уникальных значений
  return Array.from(
    new Set(brandsResult.data.map(({ brand }) => brand) || []),
  ).filter(Boolean);
};

export const getCategoriesList = async () => {
  const supabase = await createServerClient();

  // Получаем уникальные категории
  const categoriesResult = await supabase.rpc("get_categories");

  if (categoriesResult.error) {
    throw new Error("Error get categories", categoriesResult.error);
  }

  // Преобразуем данные в массивы уникальных значений
  return Array.from(
    new Set(categoriesResult.data.map(({ category }) => category) || []),
  ).filter(Boolean);
};

export const getShopsList = async () => {
  const supabase = await createServerClient();

  // Получаем уникальные магазины
  const shopsResult = await supabase.rpc("get_shops");

  if (shopsResult.error) {
    throw new Error("Error get shops", shopsResult.error);
  }

  // Преобразуем данные в массивы уникальных значений
  return Array.from(
    new Set(shopsResult.data.map(({ shop }) => shop) || []),
  ).filter(Boolean);
};

export const getVolumesList = async () => {
  const supabase = await createServerClient();

  // Получаем уникальные объемы
  const volumesResult = await supabase.rpc("get_volumes");

  if (volumesResult.error) {
    throw new Error("Error get volumes", volumesResult.error);
  }

  // Преобразуем данные в массивы уникальных значений
  return Array.from(
    new Set(volumesResult.data.map(({ volume }) => volume) || []),
  ).filter(Boolean);
};

const getPriceRange = async () => {
  const supabase = await createServerClient();

  // Получаем диапазон цены покупки
  const priceRangeResult = await supabase.rpc("get_price_range");

  if (priceRangeResult.error) {
    throw new Error("Error get price range", priceRangeResult.error);
  }

  // Преобразуем данные в массивы уникальных значений
  return [
    Math.ceil(priceRangeResult.data[0]?.min_price ?? 0),
    Math.ceil(priceRangeResult.data[0]?.max_price ?? 100),
  ];
};

export const getFilter = async () => ({
  brands: await getBrandsList(),
  categories: await getCategoriesList(),
  shops: await getShopsList(),
  volumes: await getVolumesList(),
  priceRange: await getPriceRange(),
});
