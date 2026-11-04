import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { createServerClient } from "@/shared/server";

export async function AuthButton() {
  const supabase = await createServerClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return (
    <div className='flex items-center gap-4'>
      {user ? (
        <Button asChild size='sm' variant='outline'>
          <Link href='/profile'>
            <User />
            <span className='max-w-40 truncate'>{user.email}</span>
          </Link>
        </Button>
      ) : (
        <Button asChild size='sm' variant='outline'>
          <Link href='/auth/login'>Вход</Link>
        </Button>
      )}
    </div>
  );
}
