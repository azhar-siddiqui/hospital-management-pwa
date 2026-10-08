import Link from "next/link";
import { notFound } from "next/navigation";

import { StaffPermissionForm } from "@/components/tables/staff-permission-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { isSeededAdmin } from "@/lib/users";

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StaffPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Permissions</h1>
        <p className="mt-1 max-w-2xl text-sm break-words text-muted-foreground">
          Choose every area {account.name} can use.
        </p>
        {locked ? null : (
          <p className="mt-1 max-w-2xl text-sm break-words text-muted-foreground">
            Manage staff is the only permission that opens a screen today. Every other choice is
            saved on this account.
          </p>
        )}
        <p className="mt-2 text-sm font-medium">{roleLabel(account.role)}</p>
      </div>
      {locked ? (
        <div className="flex max-w-2xl flex-col items-start gap-4">
          <p className="text-sm">
            {account.id === actor.id
              ? "You can’t change your own permissions."
              : "The admin account keeps every permission."}
          </p>
          <Button
            variant="outline"
            className="scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0"
            nativeButton={false}
            render={<Link href="/staff" />}
          >
            Back to staff
          </Button>
        </div>
      ) : (
        <StaffPermissionForm key={account.id} userId={account.id} assigned={assigned} />
      )}
    </main>
  );
}
