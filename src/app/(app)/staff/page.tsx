import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { StaffTable } from "@/components/tables/directory-tables";
import { requireAdmin } from "@/lib/auth";
import { queryStaff } from "@/lib/record-queries";
import { readDataTableQuery, readTableMode, staffFilters, staffSearch } from "@/lib/table-search";
import { Suspense } from "react";

export default async function StaffPage({ searchParams }: PageProps<"/staff">) {
  await requireAdmin();
  const parsed = await staffSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const { rows, total, pageCount, capped } = await queryStaff(
    readDataTableQuery(parsed, staffFilters),
    dataMode,
  );

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Accounts that can sign in.</p>
        <RecordCount total={total} capped={capped} />
      </div>

      <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
        <TableControlMenu />
        <StaffTable data={rows} pageCount={pageCount} dataMode={dataMode} filterMode={filterMode} />
      </Suspense>
    </main>
  );
}
