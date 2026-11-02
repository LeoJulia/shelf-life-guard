import { createClient } from "@supabase/supabase-js";
import { Database } from "@/shared/model";

// Импортировать только из серверного кода ("use server" / route handlers /
// Server Components): SUPABASE_SECRET_KEY обходит RLS и никогда не должен
// попадать в клиентский бандл.
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Не задан SUPABASE_SECRET_KEY");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
