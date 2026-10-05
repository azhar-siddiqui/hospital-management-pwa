import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditStaffForm } from "@/components/staff/edit-staff-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { isUuid } from "@/lib/validation";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function EditStaffPage({ params }: PageProps<"/staff/[id]/edit">) {
  const actor = await requireUser();
  if (actor.role !== "ADMIN") redirect("/");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const staff = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{staff.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roleLabel(staff.role)} · {staff.email}
        </p>
      </header>
      {staff.role === "ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin account</CardTitle>
            <CardDescription>
              This account is seeded from the server settings and cannot be edited here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Change the name, email, role, or password. The role does not change permissions. Each
            save is recorded
            {can(actor, "activity:view") ? (
              <>
                {" "}
                on the{" "}
                <Link href="/activity" className="font-medium text-primary hover:underline">
                  Activity
                </Link>{" "}
                page.
              </>
            ) : (
              "."
            )}
          </p>
          <EditStaffForm staff={staff} />
        </>
      )}
    </main>
  );
}
