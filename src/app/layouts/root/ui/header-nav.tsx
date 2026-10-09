"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils";

const navLinks = [
  { href: "/dashboard", label: "Главная" },
  { href: "/products", label: "Продукты" },
  { href: "/analytics", label: "Аналитика" },
];

export const HeaderNav = () => {
  const pathname = usePathname() ?? "";

  return (
    <nav className='hidden items-center gap-6 md:flex'>
      {navLinks.map(({ href, label }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            className={cn(
              "text-sm transition-colors",
              isActive
                ? "font-medium text-foreground hover:text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            href={href}
          >
            {label}
          </Link>
        );
      })}

      <a
        href='#'
        className='text-sm text-muted-foreground transition-colors hover:text-foreground'
      >
        Рутина
      </a>
    </nav>
  );
};
