import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<{}>(event);
  const query = getQuery(event);

  let request = supabase.from("products").select("*");

  if (query.shop) {
    request = request.eq("shop", query.shop);
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
