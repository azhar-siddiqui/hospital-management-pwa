import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { ExpensesTable, StockTable } from "@/components/tables/directory-tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { queryExpenses, queryStock } from "@/lib/record-queries";
import {
  expenseFilters,
  expenseQueryKeys,
  inventorySearch,
  readDataTableQuery,
  readTableMode,
  stockFilters,
  stockQueryKeys,
} from "@/lib/table-search";
import { IconPlus, IconReceipt } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function InventoryPage({ searchParams }: PageProps<"/inventory">) {
  const user = await requirePermission("inventory:view");
  const parsed = await inventorySearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const manage = can(user.role, "inventory:manage");
  const seeExpenses = can(user.role, "expenses:view");
  const [stock, expenses] = await Promise.all([
    queryStock(readDataTableQuery(parsed, stockFilters, stockQueryKeys), dataMode),
    seeExpenses
      ? queryExpenses(readDataTableQuery(parsed, expenseFilters, expenseQueryKeys), dataMode)
      : Promise.resolve(null),
  ]);

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stock quantities and daily expenses recorded by the signed-in user.
          </p>
        </div>
        {manage || can(user.role, "expenses:create") ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {manage ? (
              <Button
                nativeButton={false}
                className="w-full sm:w-auto"
                render={<Link href="/inventory/new" />}
              >
                <IconPlus />
                Add item
              </Button>
            ) : null}
            {can(user.role, "expenses:create") ? (
              <Button
                nativeButton={false}
                variant="outline"
                className="w-full sm:w-auto"
                render={<Link href="/inventory/expenses/new" />}
              >
                <IconReceipt />
                Record expense
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <TableControlMenu />
      </Suspense>

      <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
        <StockTable
          data={stock.rows}
          pageCount={stock.pageCount}
          dataMode={dataMode}
          filterMode={filterMode}
          manage={manage}
        />
      </Suspense>

      {expenses ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
              <RecordCount total={expenses.total} capped={expenses.capped} />
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <Suspense fallback={<DataTableSkeleton columnCount={5} filterCount={3} />}>
              <ExpensesTable
                data={expenses.rows}
                pageCount={expenses.pageCount}
                dataMode={dataMode}
                filterMode={filterMode}
              />
            </Suspense>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
