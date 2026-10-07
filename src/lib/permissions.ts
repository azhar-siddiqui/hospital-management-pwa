export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "RECEPTIONIST",
  "DOCTOR",
  "NURSE",
  "ASSISTANT",
] as const;

export const PERMISSIONS = ["staff:manage"] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export type AccessSubject = {
  role: string;
  permissions?: readonly string[] | null;
};

export function roleGrants(role: string): Permission[] {
  if (role === "ADMIN") return ["staff:manage"];
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
