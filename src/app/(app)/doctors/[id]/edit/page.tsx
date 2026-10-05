import Link from "next/link";
import { notFound } from "next/navigation";
import { EditDoctorForm } from "@/components/doctors/edit-doctor-form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isUuid } from "@/lib/validation";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function EditDoctorPage({ params }: PageProps<"/doctors/[id]/edit">) {
  const user = await requirePermission("doctors:manage");
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    select: { id: true, name: true, specialty: true, phone: true },
  });
  if (!doctor) notFound();

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href="/doctors" />}
        >
          <IconChevronLeft />
          Doctors
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{doctor.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Change the name, specialty, or phone. Receipts already written keep the earlier name. Each
          save is recorded
          {can(user, "activity:view") ? (
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
      </header>
      <EditDoctorForm doctor={doctor} />
    </main>
  );
}
