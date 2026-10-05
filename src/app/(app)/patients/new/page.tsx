import Link from "next/link";
import { RegisterPatientForm } from "@/components/hospital/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { doctorChoices } from "@/lib/doctors";
import { can } from "@/lib/permissions";
import type { VisitTypeName } from "@/lib/validation";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function NewPatientPage() {
  const user = await requirePermission("patients:register");
  const visitTypes = (["OPD", "IPD"] as const).filter((type) =>
    can(user, type === "OPD" ? "visits:opd" : "visits:admit"),
  ) as VisitTypeName[];
  const doctors = visitTypes.length > 0 ? await doctorChoices() : [];

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href="/patients" />}
        >
          <IconChevronLeft />
          Patients
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Add patient</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a person and open their first visit.
        </p>
      </header>

      {visitTypes.length > 0 ? (
        <RegisterPatientForm visitTypes={visitTypes} doctors={doctors} />
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This account cannot start an OPD or IPD visit, so registration is unavailable.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
