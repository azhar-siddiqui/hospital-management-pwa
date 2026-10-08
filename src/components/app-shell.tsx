"use client";

import { logout } from "@/app/actions/auth";
import {
  groupNav,
  isCurrent,
  linksForRole,
  sectionTitle,
  type NavItem,
} from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { preferenceCookie, SIDEBAR_COOKIE } from "@/lib/chrome";
import { dashboardCollection, freeBeds, opdToday } from "@/lib/dashboard-sample";
import { roleLabel } from "@/lib/roles";
import {
  IconBed,
  IconCash,
  IconLogout,
  IconPlus,
  IconStethoscope,
  IconX,
} from "@tabler/icons-react";
import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

type ShellUser = { name: string; role: string; permissions: string[] };

const sidebarRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const sidebarToday = [
  { label: "OPD", value: String(opdToday), icon: IconStethoscope, wide: false },
  { label: "Beds free", value: String(freeBeds), icon: IconBed, wide: false },
  {
    label: "Collected",
    value: sidebarRupees.format(dashboardCollection.today),
    icon: IconCash,
    wide: true,
  },
];

export function AppShell({
  user,
  todayLabel,
  sidebarClosed: sidebarStartsClosed,
  children,
}: {
  user: ShellUser;
  todayLabel: string;
  sidebarClosed: boolean;
  children: React.ReactNode;
}) {
  const [sidebarClosed, setSidebarClosed] = useState(sidebarStartsClosed);

  return (
    <SidebarProvider
      open={!sidebarClosed}
      onOpenChange={(open) => {
        setSidebarClosed(!open);
        document.cookie = preferenceCookie(SIDEBAR_COOKIE, open ? "open" : "closed");
      }}
      className="min-h-full flex-1 bg-muted/40 print:bg-white"
    >
      <AppSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader todayLabel={todayLabel} user={user} />
        <div className="mx-auto flex w-full flex-1 flex-col px-4 pt-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 md:px-8 md:pt-8 md:pb-8 print:max-w-none print:bg-white print:p-0">
          {children}
        </div>
        <PhoneTabs user={user} />
      </div>
    </SidebarProvider>
  );
}

function AppHeader({ todayLabel, user }: { todayLabel: string; user: ShellUser }) {
  const pathname = usePathname();
  const title = sectionTitle(pathname);

  return (
    <>
      <header className="app-chrome sticky top-0 z-30 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center gap-1 px-2">
          <SidebarTrigger className="size-11" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
        </div>
      </header>
      <header className="app-chrome sticky top-0 z-20 hidden border-b border-border bg-card/95 backdrop-blur-md md:block">
        <div className="flex h-14 min-w-0 items-center gap-3 px-8">
          <SidebarTrigger className="size-11" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <p className="text-sm text-muted-foreground">{todayLabel}</p>
            <span className="h-5 w-px bg-border" aria-hidden />
            <span
              className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold"
              aria-hidden
            >
              {initials(user.name)}
            </span>
            <span className="hidden max-w-40 truncate text-sm font-medium xl:inline">
              {user.name}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}

function AppSidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const links = linksForRole(user);
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="app-chrome app-sidebar">
      <SidebarHeader className="pt-[max(0.5rem,env(safe-area-inset-top))] group-data-[collapsible=icon]:px-1">
        <div className="flex items-center gap-2.5 px-1.5 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
            aria-hidden
          >
            <IconPlus className="size-5" stroke={2.25} />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold tracking-tight">Hospital</p>
            <p className="truncate text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
              Operations
            </p>
          </div>
          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="ml-auto size-11 shrink-0"
              aria-label="Close sidebar"
              onClick={() => setOpenMobile(false)}
            >
              <IconX className="size-5" aria-hidden />
            </Button>
          ) : null}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groupNav(links).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setOpenMobile(false)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="pb-[max(0.5rem,env(safe-area-inset-bottom))] group-data-[collapsible=icon]:px-1">
        <div className="rounded-xl bg-card p-2 shadow-sm ring-1 ring-foreground/10 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:ring-0">
          <section aria-label="Today" className="px-1 pt-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Today
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-1.5">
              {sidebarToday.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-1.5 py-1.5",
                      row.wide && "col-span-2 justify-between bg-primary/10",
                    )}
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-md bg-card text-primary shadow-sm ring-1 ring-foreground/10"
                      aria-hidden
                    >
                      <Icon className="size-3.5" stroke={1.75} />
                    </span>
                    <div
                      className={cn(
                        "min-w-0 flex-1",
                        row.wide && "flex items-center justify-between gap-2",
                      )}
                    >
                      <dt
                        className={cn(
                          "truncate text-[10px] font-medium text-muted-foreground",
                          row.wide && "text-xs text-primary",
                        )}
                      >
                        {row.label}
                      </dt>
                      <dd
                        className={cn(
                          "font-semibold tabular-nums",
                          row.wide ? "shrink-0 text-sm" : "text-sm leading-tight",
                        )}
                      >
                        {row.value}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>
          <div className="mt-2 border-t border-border px-1 pt-2 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-0">
            <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold ring-1 ring-foreground/10"
                aria-hidden
              >
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabel(user.role)}</p>
              </div>
            </div>
            <form action={logout} className="mt-1.5 group-data-[collapsible=icon]:mt-1">
              <Button
                type="submit"
                variant="outline"
                className="h-11 w-full bg-transparent text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
                aria-label="Sign out"
              >
                <IconLogout />
                <span className="group-data-[collapsible=icon]:sr-only">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavRow({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const current = isCurrent(pathname, item.href);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={current}
        tooltip={item.label}
        className={cn(
          "h-10 gap-2.5 px-1.5 group-data-[collapsible=icon]:justify-center",
          current &&
            "bg-card shadow-sm ring-1 ring-foreground/10 hover:bg-card data-active:bg-card data-active:text-foreground data-active:hover:bg-card",
        )}
        render={<Link href={item.href} onClick={onNavigate} />}
      >
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md shadow-sm ring-1 ring-foreground/10",
            current
              ? "bg-primary text-primary-foreground ring-primary"
              : "bg-card text-muted-foreground",
          )}
          aria-hidden
        >
          <Icon stroke={1.75} />
        </span>
        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function PhoneTabs({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const { openMobile } = useSidebar();
  const tabs = linksForRole(user).filter((item) => item.tab !== false);

  return (
    <nav
      className={cn(
        "app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden",
        openMobile && "hidden",
      )}
      aria-label="Primary"
    >
      <ul className="flex">
        {tabs.map((item) => {
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
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "H";
}
