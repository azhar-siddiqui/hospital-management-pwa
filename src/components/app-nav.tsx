import {
  IconBed,
  IconLayoutDashboard,
  IconPackage,
  IconStethoscope,
  IconUserCog,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";
import { can, type Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  permission: Permission | null;
  icon: Icon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Home", permission: null, icon: IconLayoutDashboard },
  { href: "/patients", label: "Patients", shortLabel: "Patients", permission: "patients:view", icon: IconUsers },
  { href: "/doctors", label: "Doctors", shortLabel: "Doctors", permission: "doctors:manage", icon: IconStethoscope },
  { href: "/beds", label: "Beds", shortLabel: "Beds", permission: "beds:view", icon: IconBed },
  { href: "/inventory", label: "Inventory", shortLabel: "Stock", permission: "inventory:view", icon: IconPackage },
  { href: "/staff", label: "Staff", shortLabel: "Staff", permission: "staff:manage", icon: IconUserCog },
];

export function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/patients" && (pathname.startsWith("/patients") || pathname.startsWith("/visits"))) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function linksForRole(role: string) {
  return NAV_ITEMS.filter((item) => item.permission === null || can(role, item.permission));
}

export function sectionTitle(pathname: string) {
  if (pathname.startsWith("/visits/") && pathname.endsWith("/receipt")) return "Receipt";
  if (pathname.startsWith("/visits/")) return "Visit";
  return NAV_ITEMS.find((item) => isCurrent(pathname, item.href))?.label ?? "Hospital";
}
