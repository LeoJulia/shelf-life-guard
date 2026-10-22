import type { SupabaseClient } from "@supabase/supabase-js";

const BASE64_IMAGE_RE = /^data:image\/([^;]+);base64,/;

/**
 * Загружает изображение из FormData, где оно лежит base64 data-URL.
 *
 * Клиент сжимает файл (compressImage) и кладёт его в скрытое поле формы,
 * сервер раскодировывает base64 и сохраняет объект в приватный бакет.
 *
 * Тип клиента — SupabaseClient, а не вывод из createServerClient, чтобы модуль
 * не тянул next/headers и был импортируем в том числе из клиентского кода.
 *
 * @param bucket    приватный бакет Supabase Storage
 * @param formData  данные формы
 * @param fieldName имя поля с base64 (по умолчанию "image")
 * @param folders   дополнительные сегменты пути после `{user.id}`
 * @returns путь объекта в бакете или null, если файла в форме не было
 */
export const uploadBase64Image = async (
  supabase: SupabaseClient,
  bucket: string,
  formData: FormData,
  fieldName = "image",
  folders: string[] = [],
): Promise<string | null> => {
  const image = formData.get(fieldName);

  if (
    !image ||
    typeof image !== "string" ||
    !BASE64_IMAGE_RE.test(image)
  ) {
    return null;
  }

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Upload image error: user is not authenticated");
  }

  const [, base64] = image.split(",");
  const contentType = image.match(/^data:(.*);base64,/)?.[1] ?? "image/webp";

  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }

  const blob = new Blob([array], { type: contentType });

  const ext = image.match(BASE64_IMAGE_RE)?.[1] ?? "webp";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = [data.user.id, ...folders, fileName].join("/");

  const { error } = await supabase.storage.from(bucket).upload(path, blob);

  if (error) {
    throw error;
  }

  return path;
};
