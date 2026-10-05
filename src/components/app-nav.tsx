import { IconUserCog, type Icon } from "@tabler/icons-react";
import { can, type AccessSubject, type Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  permission: Permission | null;
  icon: Icon;
  /** Phone tab bar. False keeps the item in the sidebar and phone menu only. */
  tab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/staff",
    label: "Staff",
    shortLabel: "Staff",
    permission: "staff:manage",
    icon: IconUserCog,
  },
];

export function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function linksForRole(subject: string | AccessSubject) {
  return NAV_ITEMS.filter((item) => item.permission === null || can(subject, item.permission));
}

export function sectionTitle(pathname: string) {
  return NAV_ITEMS.find((item) => isCurrent(pathname, item.href))?.label ?? "Staff";
}
