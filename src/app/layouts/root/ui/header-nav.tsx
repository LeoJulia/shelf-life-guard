"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils";
import { isNavLinkActive, navLinks } from "../nav-links";

export const HeaderNav = () => {
  const pathname = usePathname() ?? "";

  return (
    <nav className='hidden items-center gap-6 md:flex'>
      {navLinks.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "text-sm transition-colors",
            isNavLinkActive(pathname, href)
              ? "font-medium text-foreground hover:text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};
