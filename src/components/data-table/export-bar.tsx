"use client";

import { type RowData, Subscribe, type Table } from "@tanstack/react-table";

import type { DataTableFeatures } from "@/lib/data-table-features";
import { formatMoney, formatWhen } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function DataTableExportBar<TData extends RowData>({
  table,
  filename,
}: {
  table: Table<DataTableFeatures, TData>;
  filename: string;
}) {
  return (
    <Subscribe
      source={table.atoms.rowSelection}
      selector={() => table.getSelectedRowModel().rows.length}
    >
      {(count) =>
        count > 0 ? (
          <div className="app-chrome fixed inset-x-3 z-40 mx-auto flex max-w-md items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 shadow-lg bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-6">
            <p className="text-sm font-medium">{count} selected</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={() => downloadSelected(table, filename)}>
                Export
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => table.resetRowSelection()}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : null
      }
    </Subscribe>
  );
}

function downloadSelected<TData extends RowData>(
  table: Table<DataTableFeatures, TData>,
  filename: string,
) {
  const columns = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== "select" && column.id !== "actions");
  const rows = table.getSelectedRowModel().rows;
  const lines = [
    columns.map((column) => csv(column.columnDef.meta?.label ?? column.id)).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => csv(exportValue(column.columnDef.meta, row.getValue(column.id))))
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportValue(meta: { variant?: string; unit?: string } | undefined, value: unknown) {
  if (value == null || value === "") return "";
  if ((meta?.variant === "date" || meta?.variant === "dateRange") && typeof value === "number") {
    return formatWhen(new Date(value));
  }
  if (meta?.unit === "INR" && typeof value === "number") return formatMoney(value);
  return String(value);
}

function csv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
