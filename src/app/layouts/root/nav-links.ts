export type TNavLink = {
  href: string;
  label: string;
};

export const navLinks: TNavLink[] = [
  { href: "/dashboard", label: "Главная" },
  { href: "/products", label: "Продукты" },
  { href: "/analytics", label: "Аналитика" },
  { href: "#", label: "Рутина" },
];

export const isNavLinkActive = (pathname: string, href: string) =>
  href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));
