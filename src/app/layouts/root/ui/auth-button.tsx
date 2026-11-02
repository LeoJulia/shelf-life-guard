import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { createServerClient } from "@/shared/server";
import { isInviteAdminEmail } from "@/shared/lib/invite-admin";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createServerClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;
  const isInviteAdmin = isInviteAdminEmail(user?.email);

  return (
    <div className='flex items-center gap-4'>
      {user ? (
        <>
          {isInviteAdmin && (
            <Button asChild size='sm' variant='outline'>
              <Link href='/invites'>Приглашения</Link>
            </Button>
          )}
          <LogoutButton />
        </>
      ) : (
        <Button asChild size='sm' variant='outline'>
          <Link href='/auth/login'>Вход</Link>
        </Button>
      )}
    </div>
  );
}
