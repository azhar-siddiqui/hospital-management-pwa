import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { DoctorsTable } from "@/components/tables/directory-tables";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { queryDoctors } from "@/lib/record-queries";
import { doctorFilters, doctorSearch, readDataTableQuery, readTableMode } from "@/lib/table-search";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Doctors</h1>
          <RecordCount total={total} capped={capped} />
        </div>
        <Button
          nativeButton={false}
          className="w-full sm:w-auto"
          render={<Link href="/doctors/new" />}
        >
          <IconPlus />
          Add doctor
        </Button>
      </div>

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
