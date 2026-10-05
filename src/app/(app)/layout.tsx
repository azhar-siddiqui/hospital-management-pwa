import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { formatHospitalDay } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell
      user={{ name: user.name, role: user.role, permissions: user.permissions }}
      todayLabel={formatHospitalDay()}
    >
      {children}
    </AppShell>
  );
}
