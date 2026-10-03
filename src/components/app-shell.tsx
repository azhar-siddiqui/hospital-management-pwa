"use client";

import { logout } from "@/app/actions/auth";
import {
  isCurrent,
  linksForRole,
  sectionTitle,
  type NavItem,
} from "@/components/app-nav";
import { roleLabel } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { IconLogout, IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";

type ShellUser = { name: string; role: string };

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const drawerId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath !== null && menuPath === pathname;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const media = window.matchMedia("(min-width: 1024px)");
    function syncScroll() {
      document.body.style.overflow = media.matches ? previous : "hidden";
    }
    syncScroll();
    closeRef.current?.focus();
    media.addEventListener("change", syncScroll);
    return () => {
      document.body.style.overflow = previous;
      media.removeEventListener("change", syncScroll);
    };
  }, [open]);

  function closeMenu(restoreFocus = false) {
    if (restoreFocus) {
      const button = menuRef.current;
      if (button && button.getClientRects().length > 0) button.focus();
    }
    setMenuPath(null);
  }

  const links = linksForRole(user.role);

  return (
    <div className="flex min-h-full flex-1 bg-muted/40 print:bg-white">
      <aside className="app-chrome sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-sidebar-border lg:flex">
        <SidebarPanel user={user} links={links} pathname={pathname} />
      </aside>

      {open ? (
        <div className="app-chrome fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 animate-in bg-foreground/40 fade-in motion-reduce:animate-none"
            aria-label="Close menu"
            onClick={() => closeMenu(true)}
          />
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] animate-in shadow-xl slide-in-from-left duration-200 motion-reduce:animate-none"
            onKeyDown={(event) => onDialogKey(event, () => closeMenu(true))}
          >
            <SidebarPanel
              user={user}
              links={links}
              pathname={pathname}
              onNavigate={() => closeMenu()}
              onClose={() => closeMenu(true)}
              closeRef={closeRef}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-chrome sticky top-0 z-30 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-1 px-2">
            <Button
              ref={menuRef}
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-11"
              aria-expanded={open}
              aria-controls={open ? drawerId : undefined}
              aria-label="Open menu"
              onClick={() => setMenuPath(pathname)}
            >
              <IconMenu2 className="size-5" aria-hidden />
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">
              {sectionTitle(pathname)}
            </p>
          </div>
        </header>

        <div className="mx-auto flex w-full flex-1 flex-col px-4 pt-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-8 print:max-w-none print:bg-white print:p-0">
          {children}
        </div>

        <nav
          className={`app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden ${open ? "hidden" : ""}`}
          aria-label="Primary"
        >
          <ul className="flex">
            {links.map((item) => {
              const current = isCurrent(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={
                      current
                        ? "flex min-h-14 flex-col items-center justify-center gap-0.5 overflow-hidden px-1 text-[11px] font-semibold text-primary"
                        : "flex min-h-14 flex-col items-center justify-center gap-0.5 overflow-hidden px-1 text-[11px] font-medium text-muted-foreground"
                    }
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className="max-w-full truncate">
                      {item.shortLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function SidebarPanel({
  user,
  links,
  pathname,
  onNavigate,
  onClose,
  closeRef,
}: {
  user: ShellUser;
  links: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
  closeRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar pt-[env(safe-area-inset-top)] text-sidebar-foreground">
      <div className="flex items-center gap-3 px-4 py-4">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="size-5">
            <path fill="currentColor" d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">
            Hospital
          </p>
          <p className="truncate text-xs text-muted-foreground">Operations</p>
        </div>
        {closeRef ? (
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon-lg"
            className="size-11 shrink-0"
            aria-label="Close menu"
            onClick={onClose}
          >
            <IconX className="size-5" aria-hidden />
          </Button>
        ) : null}
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3"
        aria-label="Main"
      >
        {links.map((item) => {
          const current = isCurrent(pathname, item.href);
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              nativeButton={false}
              variant={current ? "default" : "ghost"}
              className="h-11 w-full justify-start px-3"
              aria-current={current ? "page" : undefined}
              render={<Link href={item.href} onClick={onNavigate} />}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 px-1 py-2">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold"
            aria-hidden
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roleLabel(user.role)}
            </p>
          </div>
        </div>
        <form action={logout} className="mt-1">
          <Button type="submit" variant="ghost" className="h-11 w-full justify-start px-3">
            <IconLogout className="size-5 shrink-0" aria-hidden />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "H";
}

function onDialogKey(event: KeyboardEvent<HTMLElement>, close: () => void) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    ),
  ];
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
