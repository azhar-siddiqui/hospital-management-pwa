import Link from "next/link";
import { notFound } from "next/navigation";
import { EditPatientForm } from "@/components/patients/edit-patient-form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { getPatient } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function EditPatientPage({ params }: PageProps<"/patients/[id]/edit">) {
  const user = await requirePermission("patients:register");
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href={`/patients/${patient.id}`} />}
        >
          <IconChevronLeft />
          {patient.name}
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Edit details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Change any of these details. Each save is recorded
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
      <EditPatientForm patient={patient} />
    </main>
  );
}
