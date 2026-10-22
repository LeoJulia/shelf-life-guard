import type { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_EXPIRY = 3600;

/**
 * Подписывает путь объекта в приватном бакете и возвращает временный URL.
 *
 * Тип клиента — SupabaseClient (а не вывод из createServerClient), чтобы модуль
 * не тянул next/headers.
 *
 * @param bucket приватный бакет Supabase Storage
 * @param path   путь объекта, например `{user.id}/{uuid}.webp`
 */
export const fetchSignedImageUrl = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string | null,
): Promise<string | undefined> => {
  if (!path) {
    return undefined;
  }

  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  return data?.signedUrl;
};
