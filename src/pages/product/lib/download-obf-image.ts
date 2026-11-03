import {
  ALLOWED_IMAGE_HOSTS,
  LOOKUP_TIMEOUT_MS,
  MAX_IMAGE_BYTES,
} from "../config/barcode";

/** image_url краудсорсный и публично редактируем — скачиваем только с их CDN. */
const isAllowedHost = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
};

/**
 * Скачивает фото продукта и возвращает его как base64 data URL —
 * тот же формат, что ImageUpload кладёт в поле формы, поэтому create-product
 * сможет загрузить его в Supabase Storage без изменений.
 *
 * Любая ошибка, чужой хост, не-изображение или превышение размера → undefined
 * (фото не критично).
 */
export const downloadImageAsDataUrl = async (
  url: string,
): Promise<string | undefined> => {
  if (!isAllowedHost(url)) return undefined;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

    if (!res.ok) return undefined;

    const contentType =
      res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!contentType.startsWith("image/")) return undefined;

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return undefined;
    }

    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
};
