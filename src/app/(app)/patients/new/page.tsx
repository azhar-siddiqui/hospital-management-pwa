import Link from "next/link";
import { RegisterPatientForm } from "@/components/hospital/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { doctorChoices } from "@/lib/doctors";
import { can } from "@/lib/permissions";
import type { VisitTypeName } from "@/lib/validation";

export default async function NewPatientPage() {
  const user = await requirePermission("patients:register");
  const visitTypes = (["OPD", "IPD"] as const).filter((type) =>
    can(user.role, type === "OPD" ? "visits:opd" : "visits:admit"),
  ) as VisitTypeName[];
  const doctors = visitTypes.length > 0 ? await doctorChoices() : [];

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div>
        <Button
          nativeButton={false}
          variant="link"
          className="h-auto px-0"
          render={<Link href="/patients" />}
        >
          Patients
        </Button>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Add patient</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Creates the patient and their first visit. A patient cannot have two active visits of the
          same type.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
          <CardDescription>Name and phone are required.</CardDescription>
        </CardHeader>
        <CardContent>
          {visitTypes.length > 0 ? (
            <RegisterPatientForm visitTypes={visitTypes} doctors={doctors} />
          ) : (
            <p className="text-sm text-muted-foreground">
              This account cannot start an OPD or IPD visit, so registration is unavailable.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
