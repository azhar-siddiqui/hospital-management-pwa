import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { PatientsTable } from "@/components/tables/directory-tables";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { queryPatients } from "@/lib/record-queries";
import {
  patientFilters,
  patientSearch,
  readDataTableQuery,
  readTableMode,
} from "@/lib/table-search";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function PatientsPage({ searchParams }: PageProps<"/patients">) {
  const user = await requirePermission("patients:view");
  const parsed = await patientSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const query = readDataTableQuery(parsed, patientFilters);
  const { rows, total, pageCount, capped } = await queryPatients(query, dataMode);
  const canAdd =
    can(user, "patients:register") && (can(user, "visits:opd") || can(user, "visits:admit"));

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Patients</h1>
          <RecordCount total={total} capped={capped} />
        </div>
        {canAdd ? (
          <Button
            nativeButton={false}
            className="w-full sm:w-auto"
            render={<Link href="/patients/new" />}
          >
            <IconPlus />
            Add patient
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
        <TableControlMenu />
        <PatientsTable
          data={rows}
          pageCount={pageCount}
          dataMode={dataMode}
          filterMode={filterMode}
          canEdit={can(user, "patients:register")}
        />
      </Suspense>
    </main>
  );
}
