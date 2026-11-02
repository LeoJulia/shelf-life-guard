"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "@/shared/utils";
import { createClient } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function LoginForm(props: React.ComponentPropsWithoutRef<"div">) {
  return (
    <Suspense>
      <LoginFormInner {...props} />
    </Suspense>
  );
}

function LoginFormInner({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const linkError =
    searchParams.get("error") === "invalid-link"
      ? "Ссылка недействительна или истекла — запросите новую"
      : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Вход</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className='flex flex-col gap-6'>
              {linkError && (
                <p className='text-sm text-destructive'>{linkError}</p>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='email'>Почта</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Пароль</Label>
                </div>
                <Input
                  id='password'
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className='text-sm text-destructive'>{error}</p>}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? "Вход..." : "Вход"}
              </Button>
              <Link
                href='/auth/forgot-password'
                className='text-center text-sm text-muted-foreground underline-offset-4 hover:underline'
              >
                Забыли пароль?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
