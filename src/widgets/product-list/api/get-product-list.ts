import { createServerClient } from "@/shared/server";
import { Tables, TProductTag } from "@/shared/model";
import { fetchSignedImageUrl } from "@/shared/lib/signed-image-url";
import { PRODUCT_IMAGES_BUCKET } from "@/shared/lib/buckets";
import type { TProduct } from "@/entities/product";

// Батч выгрузки всех строк для аналитики: равен Data API max_rows (1000).
const FETCH_ALL_BATCH = 1000;

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

export type TProductListResult = {
  products: TProduct[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type TGetProductListOptions = {
  withImages?: boolean;
  /**
   * Положительный размер страницы включает серверную пагинацию (.range +
   * count:exact). Без него выгружаются все подходящие строки (аналитика).
   */
  pageSize?: number;
};

const parsePage = (value: string | string[] | undefined) => {
  const parsed = Number(toList(value)[0]);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
};

export const getProductList = async (
  searchParameters: Record<string, string | string[] | undefined> = {},
  { withImages = true, pageSize }: TGetProductListOptions = {},
): Promise<TProductListResult> => {
  const supabase = await createServerClient();

  const paginated = typeof pageSize === "number" && pageSize > 0;
  const size = paginated ? Math.floor(pageSize) : 0;
  const requestedPage = paginated ? parsePage(searchParameters.page) : 1;

  const emptyResult: TProductListResult = {
    products: [],
    total: 0,
    page: 1,
    pageSize: paginated ? size : 0,
    pageCount: 0,
  };

  const brands = toList(searchParameters.brand);
  const categories = toList(searchParameters.category);
  const shops = toList(searchParameters.shop);
  const tagNames = toList(searchParameters.tag);
  const sort = toList(searchParameters.sort)[0];
  const query = toList(searchParameters.query)[0];

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

  const expiringDays = isEnabled(searchParameters.expiring)
    ? 90
    : isEnabled(searchParameters.expiringSoon)
      ? 30
      : 0;

  // Поиск и теги резолвятся до построения запроса: пустой результат сразу
  // отдаёт пустую страницу, а .in("id", ids) применяется в buildRequest.
  let matchIds: string[] | null = null;
  if (query) {
    // Параметризованный RPC: запятые, скобки и кавычки в запросе — литералы,
    // а не разделители синтаксиса PostgREST .or(), который ломал страницу.
    const { data: matchRows, error: searchError } = await supabase.rpc(
      "search_product_ids",
      { p_query: query },
    );

    if (searchError) {
      throw new Error("Error on search products", { cause: searchError });
    }

    matchIds = matchRows.map(({ id }) => id);
    if (matchIds.length === 0) {
      return emptyResult;
    }
  }

  let tagProductIds: string[] | null = null;
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
      return emptyResult;
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

    tagProductIds = Array.from(
      new Set(linkRows.map(({ product_id }) => product_id)),
    );
    if (tagProductIds.length === 0) {
      return emptyResult;
    }
  }

  // Свежий builder на каждый вызов: исполненный thenable переиспользовать
  // нельзя. head=true — только count (без Range), чтобы клампить страницу до
  // выборки данных: PostgREST отдаёт 416 на Range за пределами результата.
  const buildRequest = (head = false) => {
    let request = supabase
      .from("products")
      .select("*, product_tags(tags(name, color))", { count: "exact", head });

    if (brands.length) {
      request = request.in("brand", brands);
    }
    if (categories.length) {
      request = request.in("category", categories);
    }
    if (shops.length) {
      request = request.in("shop", shops);
    }
    if (searchParameters.price_min) {
      request = request.gte("actual_price", Number(searchParameters.price_min));
    }
    if (searchParameters.price_max) {
      request = request.lte("actual_price", Number(searchParameters.price_max));
    }
    if (statusFilters.length) {
      request = request.or(statusFilters.join(","));
    }
    if (expiringDays) {
      const today = new Date().toISOString().slice(0, 10);
      const limit = new Date(Date.now() + expiringDays * 86400000)
        .toISOString()
        .slice(0, 10);
      request = request.gte("expiry_date", today).lte("expiry_date", limit);
    }
    if (matchIds) {
      request = request.in("id", matchIds);
    }
    if (tagProductIds) {
      request = request.in("id", tagProductIds);
    }

    if (sort) {
      switch (sort) {
        case "actual_price_asc":
          request = request.order("actual_price");
          break;
        case "actual_price_desc":
          request = request.order("actual_price", { ascending: false });
          break;
        case "created_at_asc":
          request = request.order("year").order("created_at");
          break;
        case "created_at_desc":
          request = request
            .order("year", { ascending: false })
            .order("created_at", { ascending: false });
          break;
        case "expiry_date_asc":
          request = request.order("expiry_date");
          break;
        case "expiry_date_desc":
          request = request.order("expiry_date", { ascending: false });
          break;
        case "opened_at_asc":
          request = request.order("opened_at");
          break;
        case "opened_at_desc":
          request = request.order("opened_at", { ascending: false });
          break;
        case "finished_at_asc":
          request = request.order("finished_at");
          break;
        case "finished_at_desc":
          request = request.order("finished_at", { ascending: false });
          break;
      }
    }

    return request;
  };

  let rows: (Tables<"products"> & TProductRowWithTags)[];
  let total: number;
  let page: number;
  let pageCount: number;

  if (paginated) {
    // Сначала точный count без Range: запрашивать страницу за пределами
    // результата нельзя (416), а клампить нужно до выборки данных.
    const { count, error: countError } = await buildRequest(true);
    if (countError) {
      throw new Error("Error on get product list", { cause: countError });
    }

    total = count ?? 0;
    pageCount = Math.ceil(total / size);
    page = pageCount > 0 ? Math.min(requestedPage, pageCount) : 1;

    if (total === 0) {
      rows = [];
    } else {
      const from = (page - 1) * size;
      const { data, error } = await buildRequest().range(from, from + size - 1);
      if (error) {
        throw new Error("Error on get product list", { cause: error });
      }
      rows = data;
    }
  } else {
    // Сначала точный count: зная total, останавливаемся до запроса Range за
    // пределами результата (PostgREST отдаёт 416). offset шагает на длину
    // ответа — не теряем строки, если max_rows окажется меньше батча.
    const { count, error: countError } = await buildRequest(true);
    if (countError) {
      throw new Error("Error on get product list", { cause: countError });
    }

    total = count ?? 0;
    page = 1;
    pageCount = total > 0 ? 1 : 0;

    const all: (Tables<"products"> & TProductRowWithTags)[] = [];
    let offset = 0;
    while (offset < total) {
      const { data, error } = await buildRequest().range(
        offset,
        offset + FETCH_ALL_BATCH - 1,
      );
      if (error) {
        throw new Error("Error on get product list", { cause: error });
      }
      // Гонка: строки удалили после count — дальше выбирать нечего.
      if (data.length === 0) break;
      all.push(...data);
      offset += data.length;
    }
    rows = all;
  }

  const products = await Promise.all(
    rows.map(async (product) => {
      const tags = extractTags(product as TProductRowWithTags);

      // Аналитике картинки не нужны: withImages=false пропускает подпись
      // каждого кадра (отдельный запрос к Storage на продукт).
      const imageUrl = withImages
        ? await fetchSignedImageUrl(
            supabase,
            PRODUCT_IMAGES_BUCKET,
            product.image_path,
          )
        : undefined;

      return {
        ...product,
        imageUrl: imageUrl ?? null,
        tags,
      };
    }),
  );

  return {
    products,
    total,
    page,
    pageSize: paginated ? size : total,
    pageCount,
  };
};
