import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  if (!query.id) return null;

  const { data: product } = await client
    .from("products")
    .select("*")
    .eq("id", query.id)
    .single();

  return product;
});
