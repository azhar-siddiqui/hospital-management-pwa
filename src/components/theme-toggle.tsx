"use client";

import { preferenceCookie, THEME_COOKIE, type ThemePreference } from "@/lib/chrome";
import { Button } from "@/components/ui/button";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ theme }: { theme: ThemePreference }) {
  const [dark, setDark] = useState(theme === "dark");

  useEffect(() => {
    function sync() {
      setDark(document.documentElement.classList.contains("dark"));
    }
    window.addEventListener("hms-theme", sync);
    return () => window.removeEventListener("hms-theme", sync);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.cookie = preferenceCookie(THEME_COOKIE, next ? "dark" : "light");
    window.dispatchEvent(new Event("hms-theme"));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="size-11 shrink-0"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
    >
      {dark ? (
        <IconSun className="size-5" aria-hidden />
      ) : (
        <IconMoon className="size-5" aria-hidden />
      )}
    </Button>
  );
}
