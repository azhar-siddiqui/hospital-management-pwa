export const SIDEBAR_COOKIE = "hms-sidebar";

export function sidebarClosed(value: string | undefined) {
  return value === "closed";
}

export function preferenceCookie(name: string, value: string) {
  return `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
