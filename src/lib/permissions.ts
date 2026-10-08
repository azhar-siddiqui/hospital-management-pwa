export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "RECEPTIONIST",
  "DOCTOR",
  "NURSE",
  "ASSISTANT",
] as const;

export const PERMISSIONS = [
  "staff:manage",
  "patients:manage",
  "visits:manage",
  "beds:manage",
  "billing:manage",
  "inventory:manage",
  "expenses:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type AppRole = (typeof APP_ROLES)[number];

const permissionCopy: Record<Permission, { label: string; description: string }> = {
  "staff:manage": {
    label: "Staff",
    description: "Open the staff directory and change permissions.",
  },
  "patients:manage": {
    label: "Patients",
    description: "Patient registration and records.",
  },
  "visits:manage": {
    label: "Visits",
    description: "OPD and IPD visits.",
  },
  "beds:manage": {
    label: "Beds",
    description: "Bed allocation.",
  },
  "billing:manage": {
    label: "Billing",
    description: "Fees and service charges.",
  },
  "inventory:manage": {
    label: "Stock",
    description: "Medicines and supplies.",
  },
  "expenses:manage": {
    label: "Expenses",
    description: "Daily expenses.",
  },
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function permissionLabel(permission: string) {
  return isPermission(permission) ? permissionCopy[permission].label : permission;
}

export function permissionDescription(permission: Permission) {
  return permissionCopy[permission].description;
}

/** Keeps known permissions, in catalog order. Returns null when a value is unknown. */
export function normalizePermissions(values: readonly string[]): Permission[] | null {
  const unique = new Set(values.map((value) => value.trim()).filter(Boolean));
  for (const value of unique) {
    if (!isPermission(value)) return null;
  }
  return PERMISSIONS.filter((permission) => unique.has(permission));
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export type AccessSubject = {
  role: string;
  permissions?: readonly string[] | null;
};

export function roleGrants(role: string): Permission[] {
  if (role === "ADMIN") return [...PERMISSIONS];
  return [];
}

export function can(subject: string | AccessSubject, permission: Permission) {
  if (typeof subject !== "string" && subject.role === "ADMIN") return true;
  const role = typeof subject === "string" ? subject : subject.role;
  const stored = typeof subject === "string" ? null : subject.permissions;
  const list = stored ?? roleGrants(role);
  return list.includes(permission);
}

export function permissionForPath(pathname: string): Permission | null {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) return "staff:manage";
  return null;
}

export function safeReturnPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("%")
  ) {
    return "/";
  }
  if (value === "/staff" || value.startsWith("/staff/")) return value;
  return "/";
}
