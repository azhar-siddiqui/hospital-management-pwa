import Link from "next/link";
import { notFound } from "next/navigation";

import { StaffEditScreen } from "@/components/tables/staff-edit-screen";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isStaffRole, roleLabel } from "@/lib/roles";
import { isSeededAdmin } from "@/lib/users";
import { IconArrowLeft } from "@tabler/icons-react";

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  const { id } = await params;
  if (!USER_ID.test(id)) notFound();

  const account = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  });
  if (!account) notFound();

  const locked =
    account.id === actor.id || isSeededAdmin(account.email) || account.role === "ADMIN";
  const assigned = PERMISSIONS.filter((permission) => account.permissions.includes(permission));
  const staffRole = isStaffRole(account.role) ? account.role : null;

  if (staffRole && !locked) {
    return (
      <StaffEditScreen
        userId={account.id}
        name={account.name}
        email={account.email}
        role={staffRole}
        assigned={assigned}
      />
    );
  }

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Edit staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          This account can’t be changed from the staff list.
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <section className="min-w-0 rounded-xl bg-card px-4 py-4 text-card-foreground ring-1 ring-foreground/10 sm:px-5">
          <h2 className="text-sm font-medium">{account.name}</h2>
          <p className="mt-1 text-sm font-medium">{roleLabel(account.role)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {account.id === actor.id
              ? "You can't change your own account."
              : "The admin account can't be changed."}
          </p>
        </section>
        <div>
          <Button
            variant="ghost"
            className="scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0"
            nativeButton={false}
            render={<Link href="/staff" />}
          >
            <IconArrowLeft data-icon="inline-start" /> Back
          </Button>
        </div>
      </div>
    </main>
  );
}
