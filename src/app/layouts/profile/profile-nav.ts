import {
  Images,
  MonitorSmartphone,
  Tags,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type TProfileNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const profileNavLinks: TProfileNavLink[] = [
  { href: "/profile/account", label: "Аккаунт", icon: User },
  { href: "/profile/photos", label: "Фотографии", icon: Images },
  { href: "/profile/tags", label: "Теги", icon: Tags },
  { href: "/profile/sessions", label: "Устройства", icon: MonitorSmartphone },
  {
    href: "/profile/invites",
    label: "Приглашения",
    icon: UserPlus,
    adminOnly: true,
  },
];

export const isProfileNavActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
