import { Suspense } from "react";
import { RegisterPatientForm } from "@/components/hospital/forms";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { PatientsTable } from "@/components/tables/directory-tables";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { doctorChoices } from "@/lib/doctors";
import { queryPatients } from "@/lib/record-queries";
import { can } from "@/lib/permissions";
import {
  patientFilters,
  patientSearch,
  readDataTableQuery,
  readTableMode,
} from "@/lib/table-search";
import type { VisitTypeName } from "@/lib/validation";

export default async function PatientsPage({ searchParams }: PageProps<"/patients">) {
  const user = await requirePermission("patients:view");
  const parsed = await patientSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const query = readDataTableQuery(parsed, patientFilters);
  const { rows, total, pageCount, capped } = await queryPatients(query, dataMode);
  const visitTypes = (["OPD", "IPD"] as const).filter((type) =>
    can(user.role, type === "OPD" ? "visits:opd" : "visits:admit"),
  ) as VisitTypeName[];
  const doctors =
    can(user.role, "patients:register") && visitTypes.length > 0 ? await doctorChoices() : [];

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Patients</h1>
        <RecordCount total={total} capped={capped} />
      </div>

      {can(user.role, "patients:register") && visitTypes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Creates the patient and their first visit. A patient cannot have two active visits of
              the same type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterPatientForm visitTypes={visitTypes} doctors={doctors} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 py-4">
          <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
            <TableControlMenu />
            <PatientsTable
              data={rows}
              pageCount={pageCount}
              dataMode={dataMode}
              filterMode={filterMode}
            />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
