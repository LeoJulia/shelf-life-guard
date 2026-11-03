"use server";

import { hasSession } from "@/shared/server";
import {
  LOOKUP_BASE_URLS,
  LOOKUP_FIELDS,
  LOOKUP_TIMEOUT_MS,
  VALID_CODE_LENGTHS,
} from "../config/barcode";
import type { TBarcodeLookupResult } from "../model/barcode-types";
import { extractImageUrl, mapOBFProduct, type TOBFProduct } from "../lib/map-obf-product";
import { downloadImageAsDataUrl } from "../lib/download-obf-image";

/**
 * User-Agent обязателен по политике Open Food/Beauty Facts.
 * Браузер не может выставить его во fetch, поэтому весь поиск — на сервере.
 */
const getUserAgent = (): string => {
  const contact =
    process.env.OPENFOODFACTS_CONTACT || process.env.SITE_URL || "no-contact";
  return `shelf-life-guard/1.0 (${contact})`;
};

const isValidCode = (code: string): boolean =>
  /^\d+$/.test(code) && VALID_CODE_LENGTHS.includes(code.length);

/**
 * Запрашивает продукт в одном источнике.
 * null — продукта там нет; бросает исключение — источник недоступен (5xx, таймаут).
 */
const fetchProduct = async (
  baseUrl: string,
  code: string,
): Promise<TOBFProduct | null> => {
  const url = `${baseUrl}/api/v2/product/${code}.json?fields=${LOOKUP_FIELDS}`;

  const res = await fetch(url, {
    headers: { "User-Agent": getUserAgent() },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    next: { revalidate: 60 * 60 * 24 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Barcode lookup HTTP ${res.status}`);

  const json = (await res.json()) as { status?: number; product?: TOBFProduct };

  if (json.status !== 1 || !json.product) return null;

  return json.product;
};

/**
 * Ищет продукт по штрих-коду, перебирая источники (Open Beauty Facts, затем
 * Open Food Facts — их базы пересекаются). Возвращает данные для автозаполнения
 * формы или found:false с причиной (not_found / source_error) — форму не роняем.
 */
export const lookupBarcode = async (
  rawCode: string,
): Promise<TBarcodeLookupResult> => {
  const code = rawCode.trim();

  if (!isValidCode(code)) {
    return { found: false, code, reason: "not_found" };
  }

  // Server action вызывается напрямую в обход страниц — пускаем только своих,
  // иначе это анонимный прокси к OBF/OFF с общим на всех лимитом по IP сервера.
  if (!(await hasSession())) {
    return { found: false, code, reason: "not_found" };
  }

  let sawSourceError = false;

  for (const baseUrl of LOOKUP_BASE_URLS) {
    try {
      const raw = await fetchProduct(baseUrl, code);
      if (!raw) continue;

      const product = mapOBFProduct(raw);
      const imageUrl = extractImageUrl(raw);

      if (imageUrl) {
        product.imageBase64 = await downloadImageAsDataUrl(imageUrl);
      }

      return { found: true, code, product };
    } catch {
      sawSourceError = true; // источник недоступен — пробуем следующий
    }
  }

  return {
    found: false,
    code,
    reason: sawSourceError ? "source_error" : "not_found",
  };
};
