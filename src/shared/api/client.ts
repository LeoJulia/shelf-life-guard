import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/shared/model";

export function createClient() {
  // Префикс NEXT_PUBLIC_ обязателен: Next.js подмешивает в клиентский бандл
  // только такие переменные. Без него здесь было бы undefined, и
  // createBrowserClient падал бы с «Your project's URL and API key are required»
  // ещё до запроса логина.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
