import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { SIDEBAR_COOKIE, sidebarClosed } from "@/lib/chrome";
import { formatHospitalDay } from "@/lib/format";
import { cookies } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const jar = await cookies();

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      }}
      todayLabel={formatHospitalDay()}
      sidebarClosed={sidebarClosed(jar.get(SIDEBAR_COOKIE)?.value)}
    >
      {children}
    </AppShell>
  );
}
