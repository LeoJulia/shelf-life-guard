import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  const query = getQuery(event);

  let request = supabase.from("products").select("*");

  if (query.brands) {
    const brands = query.brands
      ? Array.isArray(query.brands)
        ? query.brands
        : [query.brands]
      : [];

    request = request.in("brand", brands);
  }

  if (query.categories) {
    const categories = query.categories
      ? Array.isArray(query.categories)
        ? query.categories
        : [query.categories]
      : [];

    request = request.in("category", categories);
  }

  if (query.shops) {
    const shops = query.shops
      ? Array.isArray(query.shops)
        ? query.shops
        : [query.shops]
      : [];

    request = request.in("shop", shops);
  }

  if (query.minPrice) {
    request = request.gte("actual_price", Number(query.minPrice));
  }

  if (query.maxPrice) {
    request = request.lte("actual_price", Number(query.maxPrice));
  }

  if (query.shop) {
    request = request.in("shop", query.shop as string[]);
  }

  if (query.searchQuery) {
    request = request.or(
      [
        `name.ilike.%${query.searchQuery}%`,
        `brand.ilike.%${query.searchQuery}%`,
        `category.ilike.%${query.searchQuery}%`,
      ].join(","),
    );
  }

  const { data, error } = await request;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
