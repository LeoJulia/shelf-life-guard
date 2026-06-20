import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);

  const supabase = await serverSupabaseClient(event);

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { success: true };
});
