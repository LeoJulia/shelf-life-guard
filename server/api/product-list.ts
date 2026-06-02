import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  const { data: products, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return products;
});
