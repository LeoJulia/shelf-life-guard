import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<{}>(event);
  const query = getQuery(event);

  let request = supabase.from("products").select("*");

  if (query.shop) {
    request = request.eq("shop", query.shop);
  }

  if (query.search) {
    request = request.or(
      [
        `name.ilike.%${query.search}%`,
        `brand.ilike.%${query.search}%`,
        `category.ilike.%${query.search}%`,
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
