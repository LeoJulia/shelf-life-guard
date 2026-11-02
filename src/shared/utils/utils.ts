import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
// hasEnvVars исполняется в middleware (edge, env доступен в рантайме) и может
// попадать в клиентский бандл — там инлайнятся только точные обращения
// process.env.NEXT_PUBLIC_* (см. src/shared/api/client.ts).
export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
