import {
  IconBed,
  IconLayoutDashboard,
  IconPackage,
  IconHistory,
  IconCoins,
  IconReceipt,
  IconStethoscope,
  IconUserCog,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";
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
    href: "/",
    label: "Dashboard",
    shortLabel: "Home",
    permission: null,
    icon: IconLayoutDashboard,
  },
  {
    href: "/patients",
    label: "Patients",
    shortLabel: "Patients",
    permission: "patients:view",
    icon: IconUsers,
  },
  {
    href: "/doctors",
    label: "Doctors",
    shortLabel: "Doctors",
    permission: "doctors:manage",
    icon: IconStethoscope,
  },
  { href: "/beds", label: "Beds", shortLabel: "Beds", permission: "beds:view", icon: IconBed },
  {
    href: "/inventory",
    label: "Inventory",
    shortLabel: "Stock",
    permission: "inventory:view",
    icon: IconPackage,
  },
  {
    href: "/expenses",
    label: "Expenses",
    shortLabel: "Expense",
    permission: "expenses:view",
    icon: IconReceipt,
    tab: false,
  },
  {
    href: "/collection",
    label: "Collection",
    shortLabel: "Collection",
    permission: "reports:collection",
    icon: IconCoins,
    tab: false,
  },
  {
    href: "/staff",
    label: "Staff",
    shortLabel: "Staff",
    permission: "staff:manage",
    icon: IconUserCog,
  },
  {
    href: "/activity",
    label: "Activity",
    shortLabel: "Activity",
    permission: "activity:view",
    icon: IconHistory,
    tab: false,
  },
];

export function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/patients" && (pathname.startsWith("/patients") || pathname.startsWith("/visits")))
    return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function linksForRole(subject: string | AccessSubject) {
  return NAV_ITEMS.filter((item) => item.permission === null || can(subject, item.permission));
}

export function sectionTitle(pathname: string) {
  if (pathname.startsWith("/visits/") && pathname.endsWith("/receipt")) return "Receipt";
  if (pathname.startsWith("/visits/")) return "Visit";
  if (/^\/patients\/[^/]+\/edit$/.test(pathname)) return "Edit patient";
  if (/^\/doctors\/[^/]+\/edit$/.test(pathname)) return "Edit doctor";
  if (/^\/staff\/[^/]+\/edit$/.test(pathname)) return "Edit staff";
  if (pathname.startsWith("/staff/") && pathname !== "/staff/new") return "Access";
  return NAV_ITEMS.find((item) => isCurrent(pathname, item.href))?.label ?? "Hospital";
}
