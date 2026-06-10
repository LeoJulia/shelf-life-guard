import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const { id, ...updateData } = await readBody(event);

  const supabase = await serverSupabaseClient(event);

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
