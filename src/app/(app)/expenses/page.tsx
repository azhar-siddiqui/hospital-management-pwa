import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { ExpensesTable } from "@/components/tables/directory-tables";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { queryExpenses } from "@/lib/record-queries";
import {
  expenseFilters,
  expenseQueryKeys,
  expenseSearch,
  readDataTableQuery,
  readTableMode,
} from "@/lib/table-search";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const user = await requirePermission("expenses:view");
  const parsed = await expenseSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const { rows, total, pageCount, capped } = await queryExpenses(
    readDataTableQuery(parsed, expenseFilters, expenseQueryKeys),
    dataMode,
  );

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily expenses recorded by the signed-in user.
          </p>
          <RecordCount total={total} capped={capped} />
        </div>
        {can(user, "expenses:create") ? (
          <Button
            nativeButton={false}
            className="w-full sm:w-auto"
            render={<Link href="/expenses/new" />}
          >
            <IconPlus />
            Record expense
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<DataTableSkeleton columnCount={5} filterCount={3} />}>
        <TableControlMenu />
        <ExpensesTable
          data={rows}
          pageCount={pageCount}
          dataMode={dataMode}
          filterMode={filterMode}
        />
      </Suspense>
    </main>
  );
}
