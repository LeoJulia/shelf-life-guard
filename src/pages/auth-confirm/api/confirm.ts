import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/shared/model";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/shared/lib/supabase-env";

const ALLOWED_TYPES = ["invite", "recovery", "email_change"] as const;
type ConfirmType = (typeof ALLOWED_TYPES)[number];

function isAllowedType(value: string | null): value is ConfirmType {
  return (ALLOWED_TYPES as readonly string[]).includes(value ?? "");
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const redirectTo = (path: string) => {
    const url = new URL(path, origin);
    return NextResponse.redirect(url, { status: 302 });
  };

  if (!tokenHash || !isAllowedType(type)) {
    return redirectTo("/auth/login?error=invalid-link");
  }

  // Cookie обязательно пишутся на тот response-объект, который возвращается:
  // иначе сессия теряется и приглашённый попадает на /auth/invite без сессии.
  // Для email_change путь редиректа зависит от результата verifyOtp, поэтому
  // cookies копятся и применяются к финальному response.
  const pendingCookies: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          pendingCookies.push(...cookiesToSet);
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error) {
    return redirectTo("/auth/login?error=invalid-link");
  }

  let path: string;
  if (type === "email_change") {
    // Double confirmation: new_email остаётся, пока не подтверждён второй ящик.
    const { data } = await supabase.auth.getUser();
    path = data.user?.new_email
      ? "/profile?email=pending"
      : "/profile?email=changed";
  } else {
    path = type === "recovery" ? "/auth/reset" : "/auth/invite";
  }

  const response = redirectTo(path);
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );

  return response;
}
