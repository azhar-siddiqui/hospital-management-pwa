"use client";

import {
  type ColumnDef,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableCommandFilterMenu } from "@/components/data-table/data-table-command-filter-menu";
import { DataTableExportBar } from "@/components/data-table/export-bar";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortMenu } from "@/components/data-table/data-table-sort-menu";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableFeatures } from "@/lib/data-table-features";
import type { QueryKeys } from "@/lib/data-table-types";
import type { DataMode, FilterMode } from "@/lib/table-search";

export function RecordTable<TData extends RowData & { id: string }>({
  data,
  pageCount,
  columns,
  dataMode,
  filterMode,
  filename,
  queryKeys,
  initialSorting,
  columnVisibility,
}: {
  data: TData[];
  pageCount: number;
  columns: ColumnDef<DataTableFeatures, TData>[];
  dataMode: DataMode;
  filterMode: FilterMode;
  filename: string;
  queryKeys?: Partial<QueryKeys>;
  initialSorting: SortingState;
  columnVisibility?: ColumnVisibilityState;
}) {
  const shared = {
    data,
    columns,
    initialState: {
      sorting: initialSorting,
      ...(columnVisibility ? { columnVisibility } : {}),
      columnPinning: { start: ["select"], end: ["actions"] },
    },
    queryKeys,
    getRowId: (row: TData) => row.id,
    shallow: false,
    clearOnDefault: true,
    enableRowRangeSelection: true,
  };

  const { table } = useDataTable(
    dataMode === "client" ? { ...shared, mode: "client" } : { ...shared, pageCount },
  );

  return (
    <DataTable table={table} actionBar={<DataTableExportBar table={table} filename={filename} />}>
      {filterMode === "plain" ? (
        <DataTableToolbar table={table}>
          <DataTableSortMenu table={table} align="end" />
        </DataTableToolbar>
      ) : (
        <DataTableAdvancedToolbar table={table}>
          <DataTableSortMenu table={table} align="start" />
          {filterMode === "advanced" ? (
            <DataTableFilterMenu table={table} align="start" />
          ) : (
            <DataTableCommandFilterMenu table={table} align="start" />
          )}
        </DataTableAdvancedToolbar>
      )}
    </DataTable>
  );
}
