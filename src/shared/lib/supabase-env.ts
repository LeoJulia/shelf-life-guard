/**
 * На Vercel переменные проекта заведены без NEXT_PUBLIC_-префикса (исторически),
 * а локальный .env — с префиксом (он обязателен, чтобы Next.js подмешал ключ в
 * клиентский бандл). Читаем оба имени, чтобы один и тот же код работал и там,
 * и там; значение всегда публичное (publishable key), секретов здесь нет.
 *
 * Обращения к process.env.NEXT_PUBLIC_* намеренно литеральные и передаются
 * аргументами: только точные выражения Next.js инлайн-подставляет при сборке.
 * Модуль серверный — в браузерном клиенте env читается напрямую
 * (см. src/shared/api/client.ts).
 */
function readEnv(
  publicValue: string | undefined,
  bareValue: string | undefined,
  name: string,
): string {
  const value = publicValue ?? bareValue;
  if (!value) {
    throw new Error(`Не задан NEXT_PUBLIC_${name} (или ${name} на Vercel)`);
  }
  return value;
}

export function getSupabaseUrl(): string {
  return readEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    "SUPABASE_URL",
  );
}

export function getSupabasePublishableKey(): string {
  return readEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    "SUPABASE_PUBLISHABLE_KEY",
  );
}
