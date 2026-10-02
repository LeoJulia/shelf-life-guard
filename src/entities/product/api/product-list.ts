import { createServerClient } from "@/shared/server";
import { TProductTag } from "@/shared/model";
import { TProduct } from "../model";

const toList = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const isEnabled = (value: string | string[] | undefined) =>
  toList(value).includes("1");

type TProductRowWithTags = {
  product_tags?: { tags?: TProductTag | null }[] | null;
};

const extractTags = (row: TProductRowWithTags): TProductTag[] =>
  (row.product_tags ?? [])
    .map((link) => link?.tags)
    .filter((tag): tag is TProductTag => Boolean(tag?.name));

export const getProductList = async (
  searchParameters: Record<string, string | string[] | undefined> = {},
): Promise<TProduct[]> => {
  const supabase = await createServerClient();

  let request = supabase
    .from("products")
    .select("*, product_tags(tags(name, color))");

  const brands = toList(searchParameters.brand);
  if (brands.length) {
    request = request.in("brand", brands);
  }

  const categories = toList(searchParameters.category);
  if (categories.length) {
    request = request.in("category", categories);
  }

  const shops = toList(searchParameters.shop);
  if (shops.length) {
    request = request.in("shop", shops);
  }

  if (searchParameters.price_min) {
    request = request.gte("actual_price", Number(searchParameters.price_min));
  }

  if (searchParameters.price_max) {
    request = request.lte("actual_price", Number(searchParameters.price_max));
  }

  const statusFilters: string[] = [];

  if (isEnabled(searchParameters.opened)) {
    statusFilters.push("and(opened_at.not.is.null,finished_at.is.null)");
  }

  if (isEnabled(searchParameters.closed)) {
    statusFilters.push("opened_at.is.null");
  }

  if (isEnabled(searchParameters.finished)) {
    statusFilters.push("finished_at.not.is.null");
  }

  if (statusFilters.length) {
    request = request.or(statusFilters.join(","));
  }

  const expiringDays = isEnabled(searchParameters.expiring)
    ? 90
    : isEnabled(searchParameters.expiringSoon)
      ? 30
      : 0;

  if (expiringDays) {
    const today = new Date().toISOString().slice(0, 10);
    const limit = new Date(Date.now() + expiringDays * 86400000)
      .toISOString()
      .slice(0, 10);

    request = request.gte("expiry_date", today).lte("expiry_date", limit);
  }

  const query = toList(searchParameters.query)[0];

  if (query) {
    request = request.or(
      [
        `name.ilike.%${query}%`,
        `brand.ilike.%${query}%`,
        `category.ilike.%${query}%`,
      ].join(","),
    );
  }

  const sort = toList(searchParameters.sort)[0];

  if (sort) {
    switch (sort) {
      case "actual_price_asc":
        request = request.order("actual_price");
        break;

      case "actual_price_desc":
        request = request.order("actual_price", {
          ascending: false,
        });
        break;

      case "created_at_asc":
        request = request.order("year").order("created_at");
        break;

      case "created_at_desc":
        request = request
          .order("year", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });
        break;

      case "expiry_date_asc":
        request = request.order("expiry_date");
        break;

      case "expiry_date_desc":
        request = request.order("expiry_date", {
          ascending: false,
        });
        break;

      case "opened_at_asc":
        request = request.order("opened_at");
        break;

      case "opened_at_desc":
        request = request.order("opened_at", {
          ascending: false,
        });
        break;

      case "finished_at_asc":
        request = request.order("finished_at");
        break;

      case "finished_at_desc":
        request = request.order("finished_at", {
          ascending: false,
        });
        break;
    }
  }

  const tagNames = toList(searchParameters.tag);

  if (tagNames.length) {
    const { data: tagRows, error: tagError } = await supabase
      .from("tags")
      .select("id")
      .in("name", tagNames);

    if (tagError) {
      throw new Error("Error on get tags for filter", { cause: tagError });
    }

    const tagIds = tagRows.map(({ id }) => id);

    if (tagIds.length === 0) {
      return [];
    }

    const { data: linkRows, error: linkError } = await supabase
      .from("product_tags")
      .select("product_id")
      .in("tag_id", tagIds);

    if (linkError) {
      throw new Error("Error on get product tags for filter", {
        cause: linkError,
      });
    }

    const productIds = Array.from(
      new Set(linkRows.map(({ product_id }) => product_id)),
    );

    if (productIds.length === 0) {
      return [];
    }

    request = request.in("id", productIds);
  }

  const { data, error } = await request;

  if (error) {
    throw new Error("Error on get product list", { cause: error });
  }

  const products = await Promise.all(
    data.map(async (product) => {
      const tags = extractTags(product as TProductRowWithTags);

      if (!product.image_path) {
        return {
          ...product,
          imageUrl: null,
          tags,
        };
      }

      const { data } = await supabase.storage
        .from("product-images")
        .createSignedUrl(product.image_path, 3600);

      return {
        ...product,
        imageUrl: data?.signedUrl,
        tags,
      };
    }),
  );

  return products;
};
