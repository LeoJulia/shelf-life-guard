import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  if (!query.id) {
    throw createError({
      statusCode: 500,
      statusMessage: "",
    });
  }

  const { data: product, error } = await client
    .from("products")
    .select("*")
    .eq("id", query.id)
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return product;
});
