import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const supabase = await serverSupabaseClient(event);

  if (!query.id) {
    throw createError({
      statusCode: 500,
      statusMessage: "",
    });
  }

  const { data: product, error } = await supabase
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

  if (product.image_path) {
    const { data } = await supabase.storage
      .from("product-images")
      .createSignedUrl(product.image_path, 3600);

    product.imageUrl = data?.signedUrl;
  }

  return product;
});
