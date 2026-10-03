import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { CreateUserForm } from "@/components/staff/create-user-form";
import { StaffTable } from "@/components/tables/directory-tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The admin account is seeded from <code className="text-foreground">ADMIN_EMAIL</code> and{" "}
          <code className="text-foreground">ADMIN_PASSWORD</code>. Use this page to create every
          other role.
        </p>
        <RecordCount total={total} capped={capped} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New account</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
        <TableControlMenu />
        <StaffTable data={rows} pageCount={pageCount} dataMode={dataMode} filterMode={filterMode} />
      </Suspense>
    </main>
  );
}
