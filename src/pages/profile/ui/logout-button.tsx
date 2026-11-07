"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/shared/api";
import { Button } from "@/shared/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    // Завершаем только текущую сессию (дефолт SDK — global, все устройства).
    await supabase.auth.signOut({ scope: "local" });
    router.push("/auth/login");
  };

  return <Button onClick={logout}>Выход</Button>;
}
