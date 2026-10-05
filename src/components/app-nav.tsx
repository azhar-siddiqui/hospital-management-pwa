import { IconLayoutDashboard, IconUserCog, type Icon } from "@tabler/icons-react";
import { can, type AccessSubject, type Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  group: string;
  permission: Permission | null;
  icon: Icon;
  /** Phone tab bar. False keeps the item in the sidebar and phone menu only. */
  tab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Home",
    group: "Overview",
    permission: null,
    icon: IconLayoutDashboard,
  },
  {
    href: "/staff",
    label: "Staff",
    shortLabel: "Staff",
    group: "Directory",
    permission: "staff:manage",
    icon: IconUserCog,
  },
];

export function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function linksForRole(subject: string | AccessSubject) {
  return NAV_ITEMS.filter((item) => item.permission === null || can(subject, item.permission));
}

export function groupNav(links: NavItem[]) {
  const groups: { label: string; items: NavItem[] }[] = [];
  for (const item of links) {
    const last = groups[groups.length - 1];
    if (last && last.label === item.group) last.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  return groups;
}

export function sectionTitle(pathname: string) {
  return NAV_ITEMS.find((item) => isCurrent(pathname, item.href))?.label ?? "Hospital";
}
