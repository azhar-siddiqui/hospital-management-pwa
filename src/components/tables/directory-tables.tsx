"use client";

import {
  constructFilterFn,
  type Column,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { getDataTableSelectColumn } from "@/components/data-table/data-table-select-column";
import { RecordTable } from "@/components/data-table/record-table";
import { StaffPermissionCell, StaffRowActions } from "@/components/tables/staff-permissions";
import { Badge } from "@/components/ui/badge";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { formatWhen } from "@/lib/format";
import { APP_ROLES, permissionLabel } from "@/lib/permissions";
import type { StaffTableRow } from "@/lib/record-queries";
import { roleLabel } from "@/lib/roles";
import type { DataMode, FilterMode } from "@/lib/table-search";

const roleOptions = APP_ROLES.map((role) => ({ label: roleLabel(role), value: role }));

const SEARCH_INPUT_CLASS = "w-full min-w-52 max-w-72";

function includesText(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

function makeSearchFilter<TData extends RowData>(matches: (row: TData, query: string) => boolean) {
  return constructFilterFn<DataTableFeatures, TData>({
    filter: (_value, filterValue, row) => {
      const query = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!query) return true;
      return matches(row.original, query);
    },
    autoRemove: (value) => value === undefined || value === "",
  });
}

function searchColumn<TData extends RowData>(
  id: string,
  placeholder: string,
  accessorFn: (row: TData) => string,
  filterFn: ReturnType<typeof makeSearchFilter<TData>>,
): ColumnDef<DataTableFeatures, TData> {
  return {
    id,
    accessorFn,
    header: () => null,
    cell: () => null,
    meta: {
      label: "Search",
      variant: "text",
      placeholder,
      className: SEARCH_INPUT_CLASS,
    },
    enableColumnFilter: true,
    enableSorting: false,
    enableHiding: false,
    filterFn,
  };
}

const staffSearchFilter = makeSearchFilter<StaffTableRow>(
  (member, query) => includesText(member.name, query) || includesText(member.email, query),
);

function headers<TData extends Record<string, unknown>>() {
  return (label: string) =>
    function ColumnHeader({ column }: { column: Column<DataTableFeatures, TData> }) {
      return <DataTableColumnHeader column={column} label={label} />;
    };
}

function dateCell(value: number) {
  return <span className="text-muted-foreground">{formatWhen(new Date(value))}</span>;
}

export function StaffTable({
  data,
  pageCount,
  dataMode,
  filterMode,
  currentUserId,
}: {
  data: StaffTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
  currentUserId: string;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, StaffTableRow>[]>(() => {
    const header = headers<StaffTableRow>();
    return [
      getDataTableSelectColumn(),
      searchColumn(
        "search",
        "Name or email",
        (row) => [row.name, row.email].join(" "),
        staffSearchFilter,
      ),
      {
        id: "name",
        accessorKey: "name",
        header: header("Name"),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        meta: { label: "Name" },
        size: 180,
      },
      {
        id: "email",
        accessorKey: "email",
        header: header("Email"),
        meta: { label: "Email" },
        size: 220,
      },
      {
        id: "role",
        accessorKey: "role",
        header: header("Role"),
        cell: ({ row }) => roleLabel(row.original.role),
        meta: { label: "Role", variant: "multiSelect", options: roleOptions },
        enableColumnFilter: true,
        size: 140,
      },
      {
        id: "permissions",
        accessorFn: (row) =>
          row.role === "ADMIN" || row.seeded
            ? "All"
            : row.permissions.map((permission) => permissionLabel(permission)).join(", "),
        header: header("Permissions"),
        cell: ({ row }) => (
          <StaffPermissionCell
            permissions={row.original.permissions}
            locked={
              row.original.role === "ADMIN" ||
              row.original.seeded ||
              row.original.id === currentUserId
            }
          />
        ),
        meta: { label: "Permissions" },
        enableSorting: false,
        enableColumnFilter: false,
        size: 260,
      },
      {
        id: "seeded",
        accessorKey: "seeded",
        header: header("Seeded"),
        cell: ({ row }) =>
          row.original.seeded ? <Badge variant="secondary">From .env</Badge> : "No",
        meta: {
          label: "Seeded",
          variant: "boolean",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
        enableSorting: false,
        enableColumnFilter: true,
        size: 120,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: header("Added"),
        cell: ({ row }) => dateCell(row.original.createdAt),
        meta: { label: "Added", variant: "date" },
        enableColumnFilter: true,
        size: 180,
      },
      {
        id: "actions",
        header: header("Actions"),
        cell: ({ row }) => (
          <StaffRowActions
            userId={row.original.id}
            name={row.original.name}
            permissions={row.original.permissions}
            locked={
              row.original.role === "ADMIN" ||
              row.original.seeded ||
              row.original.id === currentUserId
            }
          />
        ),
        meta: { label: "Actions" },
        enableColumnFilter: false,
        enableSorting: false,
        enableHiding: false,
        size: 96,
      },
    ];
  }, [currentUserId]);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="staff"
      initialSorting={[{ id: "createdAt", desc: false }]}
      columnVisibility={{ search: false }}
    />
  );
}
