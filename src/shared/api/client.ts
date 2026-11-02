import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/shared/model";

export function createClient() {
  // Только NEXT_PUBLIC_-имена и только прямым выражением process.env.X:
  // Next.js инлайн-подставляет в клиентский бандл исключительно точные
  // обращения к NEXT_PUBLIC_*-переменным, любые обёртки/фолбэки дают undefined.
  // На Vercel для клиента должны быть заданы NEXT_PUBLIC_-имена (рядом с
  // серверными без префикса).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  if (!url || !key) {
    throw new Error(
      "Клиенту Supabase не заданы NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createBrowserClient<Database>(url, key);
}
