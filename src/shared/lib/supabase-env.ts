/**
 * На Vercel переменные проекта заведены без NEXT_PUBLIC_-префикса (исторически),
 * а локальный .env — с префиксом (он обязателен, чтобы Next.js подмешал ключ в
 * клиентский бандл). Читаем оба имени, чтобы один и тот же код работал и там,
 * и там; значение всегда публичное (publishable key), секретов здесь нет.
 */
export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  if (!url) {
    throw new Error(
      "Не задан NEXT_PUBLIC_SUPABASE_URL (или SUPABASE_URL на Vercel)",
    );
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    "";
  if (!key) {
    throw new Error(
      "Не задан NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (или SUPABASE_PUBLISHABLE_KEY на Vercel)",
    );
  }
  return key;
}
