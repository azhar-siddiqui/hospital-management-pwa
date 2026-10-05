import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { StockTable } from "@/components/tables/directory-tables";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { queryStock } from "@/lib/record-queries";
import {
  inventorySearch,
  readDataTableQuery,
  readTableMode,
  stockFilters,
  stockQueryKeys,
} from "@/lib/table-search";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function InventoryPage({ searchParams }: PageProps<"/inventory">) {
  const user = await requirePermission("inventory:view");
  const parsed = await inventorySearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const manage = can(user, "inventory:manage");
  const { rows, total, pageCount, capped } = await queryStock(
    readDataTableQuery(parsed, stockFilters, stockQueryKeys),
    dataMode,
  );

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quantities on hand. Change a quantity in the table.
          </p>
          <RecordCount total={total} capped={capped} />
        </div>
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
      </div>

      <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={4} />}>
        <TableControlMenu />
        <StockTable
          data={rows}
          pageCount={pageCount}
          dataMode={dataMode}
          filterMode={filterMode}
          manage={manage}
        />
      </Suspense>
    </main>
  );
}
