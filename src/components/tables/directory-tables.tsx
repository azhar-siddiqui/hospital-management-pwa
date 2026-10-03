"use client";

import { type Column, type ColumnDef, constructFilterFn } from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { getDataTableSelectColumn } from "@/components/data-table/data-table-select-column";
import { RecordTable } from "@/components/data-table/record-table";
import { StockForm } from "@/components/hospital/forms";
import { Badge } from "@/components/ui/badge";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { formatMoney, formatWhen } from "@/lib/format";
import type {
  ChargeTableRow,
  DoctorTableRow,
  ExpenseTableRow,
  PatientTableRow,
  StaffTableRow,
  StockTableRow,
  VisitTableRow,
} from "@/lib/record-queries";
import { roleLabel } from "@/lib/roles";
import {
  expenseQueryKeys,
  stockQueryKeys,
  type DataMode,
  type FilterMode,
} from "@/lib/table-search";
import { GENDERS, ITEM_CATEGORIES } from "@/lib/validation";
import { APP_ROLES } from "@/lib/permissions";

const genderOptions = GENDERS.map((gender) => ({ label: gender, value: gender }));
const categoryOptions = ITEM_CATEGORIES.map((category) => ({ label: category, value: category }));
const roleOptions = APP_ROLES.map((role) => ({ label: roleLabel(role), value: role }));
const visitTypeOptions = [
  { label: "OPD", value: "OPD" },
  { label: "IPD", value: "IPD" },
];
const visitStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Discharged", value: "DISCHARGED" },
];

const patientSearchFilter = constructFilterFn<DataTableFeatures, PatientTableRow>({
  filter: (_value, filterValue, row) => matchesPatientSearch(row.original, filterValue),
  autoRemove: (value) => value === undefined || value === "",
});

function matchesPatientSearch(patient: PatientTableRow, filterValue: unknown) {
  const text = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!text) return true;
  if (patient.name.toLowerCase().includes(text)) return true;
  if (patient.phone.toLowerCase().includes(text)) return true;
  return /^\d+$/.test(text) && patient.age === Number(text);
}

function headers<TData extends Record<string, unknown>>() {
  return (label: string) =>
    function ColumnHeader({ column }: { column: Column<DataTableFeatures, TData> }) {
      return <DataTableColumnHeader column={column} label={label} />;
    };
}

function dateCell(value: number) {
  return <span className="text-muted-foreground">{formatWhen(new Date(value))}</span>;
}

export function PatientsTable({
  data,
  pageCount,
  dataMode,
  filterMode,
}: {
  data: PatientTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, PatientTableRow>[]>(() => {
    const header = headers<PatientTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "search",
        accessorFn: (row) => [row.name, row.phone, row.age ?? ""].join(" "),
        header: () => null,
        cell: () => null,
        meta: {
          label: "Search",
          variant: "text",
          placeholder: "Name, phone, or age",
          className: "w-full min-w-52 max-w-72",
        },
        enableColumnFilter: true,
        enableSorting: false,
        enableHiding: false,
        filterFn: patientSearchFilter,
      },
      {
        id: "name",
        accessorKey: "name",
        header: header("Name"),
        cell: ({ row }) => (
          <Link href={`/patients/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
        meta: { label: "Name" },
        size: 180,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: header("Phone"),
        meta: { label: "Phone" },
        size: 140,
      },
      {
        id: "age",
        accessorKey: "age",
        header: header("Age"),
        cell: ({ row }) => row.original.age ?? "—",
        meta: { label: "Age" },
        size: 90,
      },
      {
        id: "gender",
        accessorKey: "gender",
        header: header("Gender"),
        cell: ({ row }) => row.original.gender ?? "—",
        meta: { label: "Gender", variant: "multiSelect", options: genderOptions },
        enableColumnFilter: true,
        size: 120,
      },
      {
        id: "registeredAt",
        accessorKey: "registeredAt",
        header: header("Registered"),
        cell: ({ row }) => dateCell(row.original.registeredAt),
        meta: { label: "Registered", variant: "date" },
        enableColumnFilter: true,
        size: 180,
      },
      {
        id: "latestVisit",
        accessorKey: "latestVisit",
        header: header("Latest visit"),
        meta: { label: "Latest visit" },
        enableSorting: false,
        enableColumnFilter: false,
        size: 240,
      },
    ];
  }, []);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="patients"
      initialSorting={[{ id: "registeredAt", desc: true }]}
      columnVisibility={{ search: false }}
    />
  );
}

export function DoctorsTable({
  data,
  pageCount,
  dataMode,
  filterMode,
}: {
  data: DoctorTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, DoctorTableRow>[]>(() => {
    const header = headers<DoctorTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "name",
        accessorKey: "name",
        header: header("Name"),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        meta: { label: "Name", variant: "text", placeholder: "Name" },
        enableColumnFilter: true,
        size: 180,
      },
      {
        id: "specialty",
        accessorKey: "specialty",
        header: header("Specialty"),
        cell: ({ row }) => row.original.specialty || "—",
        meta: { label: "Specialty", variant: "text", placeholder: "Specialty" },
        enableColumnFilter: true,
        size: 160,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: header("Phone"),
        cell: ({ row }) => row.original.phone || "—",
        meta: { label: "Phone", variant: "text", placeholder: "Phone" },
        enableColumnFilter: true,
        size: 140,
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
    ];
  }, []);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="doctors"
      initialSorting={[{ id: "name", desc: false }]}
    />
  );
}

export function StaffTable({
  data,
  pageCount,
  dataMode,
  filterMode,
}: {
  data: StaffTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, StaffTableRow>[]>(() => {
    const header = headers<StaffTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "name",
        accessorKey: "name",
        header: header("Name"),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        meta: { label: "Name", variant: "text", placeholder: "Name" },
        enableColumnFilter: true,
        size: 180,
      },
      {
        id: "email",
        accessorKey: "email",
        header: header("Email"),
        meta: { label: "Email", variant: "text", placeholder: "Email" },
        enableColumnFilter: true,
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
    ];
  }, []);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="staff"
      initialSorting={[{ id: "createdAt", desc: false }]}
    />
  );
}

export function StockTable({
  data,
  pageCount,
  dataMode,
  filterMode,
  manage,
}: {
  data: StockTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
  manage: boolean;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, StockTableRow>[]>(() => {
    const header = headers<StockTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "itemName",
        accessorKey: "itemName",
        header: header("Item"),
        cell: ({ row }) => <span className="font-medium">{row.original.itemName}</span>,
        meta: { label: "Item", variant: "text", placeholder: "Item" },
        enableColumnFilter: true,
        size: 180,
      },
      {
        id: "category",
        accessorKey: "category",
        header: header("Category"),
        cell: ({ row }) => row.original.category ?? "—",
        meta: { label: "Category", variant: "multiSelect", options: categoryOptions },
        enableColumnFilter: true,
        size: 140,
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: header("Quantity"),
        cell: ({ row }) =>
          manage ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <StockForm itemId={row.original.id} quantity={row.original.quantity} />
              <span className="text-muted-foreground">{row.original.unit}</span>
            </span>
          ) : (
            <span>
              {row.original.quantity} {row.original.unit}
            </span>
          ),
        meta: { label: "Quantity", variant: "range", range: [0, 1000] },
        enableColumnFilter: true,
        size: manage ? 280 : 140,
      },
      {
        id: "unit",
        accessorKey: "unit",
        header: header("Unit"),
        meta: { label: "Unit", variant: "text", placeholder: "Unit" },
        enableColumnFilter: true,
        size: 110,
      },
      {
        id: "lastUpdated",
        accessorKey: "lastUpdated",
        header: header("Updated"),
        cell: ({ row }) => dateCell(row.original.lastUpdated),
        meta: { label: "Updated", variant: "date" },
        enableColumnFilter: true,
        size: 180,
      },
    ];
  }, [manage]);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="stock"
      queryKeys={stockQueryKeys}
      initialSorting={[{ id: "itemName", desc: false }]}
    />
  );
}

export function ExpensesTable({
  data,
  pageCount,
  dataMode,
  filterMode,
}: {
  data: ExpenseTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, ExpenseTableRow>[]>(() => {
    const header = headers<ExpenseTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "description",
        accessorKey: "description",
        header: header("Description"),
        meta: { label: "Description", variant: "text", placeholder: "Description" },
        enableColumnFilter: true,
        size: 220,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: header("Amount"),
        cell: ({ row }) => formatMoney(row.original.amount),
        meta: { label: "Amount", variant: "number", unit: "INR", placeholder: "Amount" },
        enableColumnFilter: true,
        size: 130,
      },
      {
        id: "loggedBy",
        accessorKey: "loggedBy",
        header: header("By"),
        meta: { label: "By", variant: "text", placeholder: "Name" },
        enableColumnFilter: true,
        size: 160,
      },
      {
        id: "expenseDate",
        accessorKey: "expenseDate",
        header: header("When"),
        cell: ({ row }) => dateCell(row.original.expenseDate),
        meta: { label: "When", variant: "dateRange" },
        enableColumnFilter: true,
        size: 180,
      },
    ];
  }, []);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="expenses"
      queryKeys={expenseQueryKeys}
      initialSorting={[{ id: "expenseDate", desc: true }]}
    />
  );
}

export function VisitsTable({
  data,
  pageCount,
  dataMode,
  filterMode,
}: {
  data: VisitTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, VisitTableRow>[]>(() => {
    const header = headers<VisitTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "visitType",
        accessorKey: "visitType",
        header: header("Type"),
        cell: ({ row }) => (
          <Link href={`/visits/${row.original.id}`} className="font-medium hover:underline">
            {row.original.visitType}
          </Link>
        ),
        meta: { label: "Type", variant: "select", options: visitTypeOptions },
        enableColumnFilter: true,
        size: 110,
      },
      {
        id: "status",
        accessorKey: "status",
        header: header("Status"),
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
            {row.original.status === "ACTIVE" ? "Active" : "Discharged"}
          </Badge>
        ),
        meta: { label: "Status", variant: "select", options: visitStatusOptions },
        enableColumnFilter: true,
        size: 130,
      },
      {
        id: "admissionDate",
        accessorKey: "admissionDate",
        header: header("Admitted"),
        cell: ({ row }) => dateCell(row.original.admissionDate),
        meta: { label: "Admitted", variant: "date" },
        enableColumnFilter: true,
        size: 180,
      },
      {
        id: "consultationFee",
        accessorKey: "consultationFee",
        header: header("Fee"),
        cell: ({ row }) => formatMoney(row.original.consultationFee),
        meta: { label: "Fee", variant: "number", unit: "INR", placeholder: "Fee" },
        enableColumnFilter: true,
        size: 120,
      },
      {
        id: "bed",
        accessorKey: "bed",
        header: header("Bed"),
        cell: ({ row }) => row.original.bed ?? "—",
        meta: { label: "Bed", variant: "text", placeholder: "Bed" },
        enableColumnFilter: true,
        size: 110,
      },
    ];
  }, []);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="visits"
      initialSorting={[{ id: "admissionDate", desc: true }]}
    />
  );
}

export function ChargesTable({
  data,
  pageCount,
  dataMode,
  filterMode,
}: {
  data: ChargeTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, ChargeTableRow>[]>(() => {
    const header = headers<ChargeTableRow>();
    return [
      getDataTableSelectColumn(),
      {
        id: "serviceName",
        accessorKey: "serviceName",
        header: header("Service"),
        meta: { label: "Service", variant: "text", placeholder: "Service" },
        enableColumnFilter: true,
        size: 200,
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: header("Qty"),
        meta: { label: "Qty", variant: "number", placeholder: "Qty" },
        enableColumnFilter: true,
        size: 90,
      },
      {
        id: "unitPrice",
        accessorKey: "unitPrice",
        header: header("Unit"),
        cell: ({ row }) => formatMoney(row.original.unitPrice),
        meta: { label: "Unit", variant: "number", unit: "INR", placeholder: "Unit" },
        enableColumnFilter: true,
        size: 120,
      },
      {
        id: "total",
        accessorKey: "total",
        header: header("Total"),
        cell: ({ row }) => formatMoney(row.original.total),
        meta: { label: "Total", variant: "number", unit: "INR", placeholder: "Total" },
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
    ];
  }, []);

  return (
    <RecordTable
      data={data}
      pageCount={pageCount}
      columns={columns}
      dataMode={dataMode}
      filterMode={filterMode}
      filename="charges"
      initialSorting={[{ id: "createdAt", desc: true }]}
    />
  );
}
