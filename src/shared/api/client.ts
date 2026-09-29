import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/shared/model";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
  );
}
