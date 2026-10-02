export const APP_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "ASSISTANT"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSIONS = [
  "patients:view",
  "patients:register",
  "visits:opd",
  "visits:admit",
  "visits:note",
  "visits:discharge",
  "visits:charge",
  "beds:view",
  "beds:manage",
  "inventory:view",
  "inventory:manage",
  "expenses:view",
  "expenses:create",
  "reports:fees",
  "reports:charges",
  "reports:expenses",
  "staff:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const grants: Record<AppRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  RECEPTIONIST: ["patients:view", "patients:register", "visits:opd", "beds:view", "reports:fees"],
  DOCTOR: ["patients:view", "visits:note", "visits:discharge", "beds:view"],
  NURSE: [
    "patients:view",
    "patients:register",
    "visits:admit",
    "visits:note",
    "visits:discharge",
    "visits:charge",
    "beds:view",
    "beds:manage",
    "inventory:view",
    "reports:charges",
  ],
  ASSISTANT: [
    "patients:view",
    "beds:view",
    "inventory:view",
    "inventory:manage",
    "expenses:view",
    "expenses:create",
  ],
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export function can(role: string, permission: Permission) {
  if (!isAppRole(role)) {
    return false;
  }
  return grants[role].includes(permission);
}

export function permissionForPath(pathname: string): Permission | null {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return "staff:manage";
  }
  if (pathname === "/inventory" || pathname.startsWith("/inventory/")) {
    return "inventory:view";
  }
  if (pathname === "/beds" || pathname.startsWith("/beds/")) {
    return "beds:view";
  }
  if (
    pathname === "/patients" ||
    pathname.startsWith("/patients/") ||
    pathname === "/visits" ||
    pathname.startsWith("/visits/")
  ) {
    return "patients:view";
  }
  return null;
}

const RETURN_PREFIXES = ["/staff", "/patients", "/visits", "/beds", "/inventory"];

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("?") || value.includes("%")) {
    return "/";
  }
  const allowed = RETURN_PREFIXES.some((prefix) => value === prefix || value.startsWith(`${prefix}/`));
  return allowed ? value : "/";
}
