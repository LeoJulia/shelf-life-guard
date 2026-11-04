import { createServerClient } from "@/shared/server";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { isCurrentUserInviteAdmin } from "@/pages/profile";
import { ProfileSidebar } from "./profile-sidebar";

export const ProfileLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const isInviteAdmin = await isCurrentUserInviteAdmin();

  return (
    <SidebarProvider>
      <div className='flex w-full min-w-0 flex-col gap-6 md:flex-row'>
        <ProfileSidebar isInviteAdmin={isInviteAdmin} />
        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </SidebarProvider>
  );
};
