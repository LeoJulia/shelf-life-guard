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

  if (query.isOpenProducts === "true") {
    if (query.isFinishedProducts === "true") {
      request = request.not("opened_at", "is", null);
    } else {
      request = request.not("opened_at", "is", null).is("finished_at", null);
    }
  } else if (query.isFinishedProducts === "true") {
    request = request.not("finished_at", "is", null);
  }

  if (query.isCloseProducts === "true") {
    request = request.is("opened_at", null);
  }

  if (
    query.isTermLessThan30Days === "true" ||
    query.isTermLessThan90Days === "true"
  ) {
    const days = query.isTermLessThan90Days === "true" ? 90 : 30;

    request = request
      .gte("expiry_date", new Date().toISOString().slice(0, 10))
      .lte(
        "expiry_date",
        new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      );
  }

  const { data, error } = await request;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const products = await Promise.all(
    data.map(async (product) => {
      if (!product.image_path) {
        return {
          ...product,
          imageUrl: null,
        };
      }

      const { data } = await supabase.storage
        .from("product-images")
        .createSignedUrl(product.image_path, 3600);

      return {
        ...product,
        imageUrl: data?.signedUrl,
      };
    }),
  );

  return products;
});
