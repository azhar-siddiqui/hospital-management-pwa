import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { CreateItemForm, ExpenseForm } from "@/components/hospital/forms";
import { ExpensesTable, StockTable } from "@/components/tables/directory-tables";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stock quantities and daily expenses recorded by the signed-in user.
        </p>
        <Suspense fallback={null}>
          <TableControlMenu />
        </Suspense>
      </div>

      {manage ? (
        <Card>
          <CardHeader>
            <CardTitle>New item</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateItemForm />
          </CardContent>
        </Card>
      ) : null}

      <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
        <StockTable
          data={stock.rows}
          pageCount={stock.pageCount}
          dataMode={dataMode}
          filterMode={filterMode}
          manage={manage}
        />
      </Suspense>

      {can(user.role, "expenses:create") ? (
        <Card>
          <CardHeader>
            <CardTitle>Record expense</CardTitle>
            <CardDescription>
              Saved against your account. The amount cannot be edited later from this screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm />
          </CardContent>
        </Card>
      ) : null}

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
