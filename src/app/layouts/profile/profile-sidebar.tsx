"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar";
import { isProfileNavActive, profileNavLinks } from "./profile-nav";

type TProfileSidebarProps = {
  isInviteAdmin: boolean;
};

export const ProfileSidebar = ({ isInviteAdmin }: TProfileSidebarProps) => {
  const pathname = usePathname() ?? "";
  const { setOpenMobile } = useSidebar();

  const links = profileNavLinks.filter(
    (link) => !link.adminOnly || isInviteAdmin,
  );

  const menu = (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Кабинет</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {links.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={isProfileNavActive(pathname, href)}
                  tooltip={label}
                >
                  <Link href={href} onClick={() => setOpenMobile(false)}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );

  return (
    <>
      <aside className='hidden md:block md:w-64 md:shrink-0'>
        <div className='sticky top-6 rounded-xl border bg-sidebar text-sidebar-foreground'>
          {menu}
        </div>
      </aside>

      <div className='md:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' className='w-full justify-start'>
              <Menu data-icon='inline-start' />
              Разделы кабинета
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-64 p-0'>
            <SheetHeader className='border-b px-4 py-3 text-left'>
              <SheetTitle>Кабинет</SheetTitle>
            </SheetHeader>
            {menu}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
