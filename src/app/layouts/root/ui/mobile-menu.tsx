"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { cn } from "@/shared/utils";
import { isNavLinkActive, navLinks } from "../nav-links";

export const MobileMenu = ({ auth }: { auth?: ReactNode }) => {
  const pathname = usePathname() ?? "";

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          aria-label='Открыть меню'
          className='md:hidden'
          size='icon'
          variant='ghost'
        >
          <Menu />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Меню</DrawerTitle>
        </DrawerHeader>

        <nav className='flex flex-col gap-1 px-4'>
          {navLinks.map(({ href, label }) => {
            const className = cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              isNavLinkActive(pathname, href)
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            );

            return (
              <DrawerClose asChild key={href === "#" ? label : href}>
                {href === "#" ? (
                  <a className={className} href={href}>
                    {label}
                  </a>
                ) : (
                  <Link className={className} href={href}>
                    {label}
                  </Link>
                )}
              </DrawerClose>
            );
          })}
        </nav>

        {auth ? <DrawerFooter>{auth}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  );
};
