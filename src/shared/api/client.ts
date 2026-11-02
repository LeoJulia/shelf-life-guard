import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/shared/model";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/shared/lib/supabase-env";

export function createClient() {
  // В клиентский бандл Next.js подмешивает только NEXT_PUBLIC_*-имена (локальный
  // .env), а на Vercel переменные заданы без префикса — см. supabase-env.ts.
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
  );
}
