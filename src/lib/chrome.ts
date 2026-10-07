export const THEME_COOKIE = "hms-theme";
export const SIDEBAR_COOKIE = "hms-sidebar";

export type ThemePreference = "light" | "dark";

export function themePreference(value: string | undefined): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export function sidebarClosed(value: string | undefined) {
  return value === "closed";
}

export function preferenceCookie(name: string, value: string) {
  return `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
