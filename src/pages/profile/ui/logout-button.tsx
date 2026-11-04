"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/shared/api";
import { Button } from "@/shared/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout}>Выход</Button>;
}
