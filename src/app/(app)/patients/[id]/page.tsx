import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StartVisitForm } from "@/components/hospital/forms";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { VisitsTable } from "@/components/tables/directory-tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { doctorChoices } from "@/lib/doctors";
import { getPatient } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { queryPatientVisits } from "@/lib/record-queries";
import { readDataTableQuery, readTableMode, visitFilters, visitSearch } from "@/lib/table-search";
import type { VisitTypeName } from "@/lib/validation";
import { IconPencil } from "@tabler/icons-react";

export default async function PatientPage({ params, searchParams }: PageProps<"/patients/[id]">) {
  const user = await requirePermission("patients:view");
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const visitTypes = (["OPD", "IPD"] as const).filter((type) =>
    can(user, type === "OPD" ? "visits:opd" : "visits:admit"),
  ) as VisitTypeName[];
  const doctors = visitTypes.length > 0 ? await doctorChoices() : [];
  const active = new Set(
    patient.visits.filter((visit) => visit.status === "ACTIVE").map((visit) => visit.visitType),
  );
  const parsed = await visitSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const visits = await queryPatientVisits(
    patient.id,
    readDataTableQuery(parsed, visitFilters),
    dataMode,
  );

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            nativeButton={false}
            variant="link"
            className="h-auto px-0"
            render={<Link href="/patients" />}
          >
            Patients
          </Button>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words sm:text-3xl">
            {patient.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.phone}
            {patient.age !== null ? ` · ${patient.age} years` : ""}
            {patient.gender ? ` · ${patient.gender}` : ""}
          </p>
          {patient.address ? <p className="mt-1 text-sm break-words">{patient.address}</p> : null}
        </div>
        {can(user, "patients:register") ? (
          <Button
            nativeButton={false}
            variant="outline"
            className="w-full sm:w-auto"
            render={<Link href={`/patients/${patient.id}/edit`} />}
          >
            <IconPencil />
            Edit details
          </Button>
        ) : null}
      </div>

      {visitTypes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>New visit</CardTitle>
            {active.size > 0 ? (
              <CardDescription>
                Active now: {[...active].join(", ")}. A second active visit of the same type is
                rejected.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <StartVisitForm patientId={patient.id} visitTypes={visitTypes} doctors={doctors} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Visits</CardTitle>
          <CardDescription>
            <RecordCount total={visits.total} capped={visits.capped} />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 py-4">
          <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
            <TableControlMenu />
            <VisitsTable
              data={visits.rows}
              pageCount={visits.pageCount}
              dataMode={dataMode}
              filterMode={filterMode}
            />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
