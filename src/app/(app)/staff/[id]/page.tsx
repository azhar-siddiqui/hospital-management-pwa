import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StaffPermissionsForm } from "@/components/staff/staff-permissions-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { roleLabel } from "@/lib/roles";
import { isUuid } from "@/lib/validation";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function StaffPermissionsPage({ params }: PageProps<"/staff/[id]">) {
  const actor = await requireUser();
  if (actor.role !== "ADMIN") redirect("/");

  const { id } = await params;
  if (!isUuid(id)) notFound();
  const staff = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  });
  if (!staff) notFound();

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href="/staff" />}
        >
          <IconChevronLeft />
          Staff
        </Button>
        <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Access
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{staff.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roleLabel(staff.role)} · {staff.email}
        </p>
      </header>

      {staff.role === "ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>Full access</CardTitle>
            <CardDescription>
              This admin account can open every screen and action, all {PERMISSIONS.length}{" "}
              permissions. Those permissions cannot be removed. Change access from another staff
              row.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <StaffPermissionsForm userId={staff.id} permissions={staff.permissions} />
      )}
    </main>
  );
}
