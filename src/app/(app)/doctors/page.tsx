import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { CreateDoctorForm } from "@/components/doctors/create-doctor-form";
import { DoctorsTable } from "@/components/tables/directory-tables";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { queryDoctors } from "@/lib/record-queries";
import { doctorFilters, doctorSearch, readDataTableQuery, readTableMode } from "@/lib/table-search";
import { Suspense } from "react";

export default async function DoctorsPage({ searchParams }: PageProps<"/doctors">) {
  await requirePermission("doctors:manage");
  const parsed = await doctorSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const { rows, total, pageCount, capped } = await queryDoctors(
    readDataTableQuery(parsed, doctorFilters),
    dataMode,
  );

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Doctors</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Referring doctors selected when a patient is registered. The visit keeps the name even if
          this record changes later.
        </p>
        <RecordCount total={total} capped={capped} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add doctor</CardTitle>
          <CardDescription>
            Name is required. Specialty and phone help the front desk tell people apart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDoctorForm />
        </CardContent>
      </Card>

      <Suspense fallback={<DataTableSkeleton columnCount={5} filterCount={3} />}>
        <TableControlMenu />
        <DoctorsTable
          data={rows}
          pageCount={pageCount}
          dataMode={dataMode}
          filterMode={filterMode}
        />
      </Suspense>
    </main>
  );
}
