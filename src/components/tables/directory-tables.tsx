"use client";

import {
  constructFilterFn,
  type Column,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { getDataTableSelectColumn } from "@/components/data-table/data-table-select-column";
import { RecordTable } from "@/components/data-table/record-table";
import { StockForm } from "@/components/hospital/forms";
import { Badge } from "@/components/ui/badge";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { formatMoney, formatWhen } from "@/lib/format";
import { APP_ROLES } from "@/lib/permissions";
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

const patientSearchFilter = makeSearchFilter<PatientTableRow>((patient, query) => {
  if (includesText(patient.name, query)) return true;
  if (includesText(patient.phone, query)) return true;
  return /^\d+$/.test(query) && patient.age === Number(query);
});

const doctorSearchFilter = makeSearchFilter<DoctorTableRow>(
  (doctor, query) =>
    includesText(doctor.name, query) ||
    includesText(doctor.specialty, query) ||
    includesText(doctor.phone, query),
);

const staffSearchFilter = makeSearchFilter<StaffTableRow>(
  (member, query) => includesText(member.name, query) || includesText(member.email, query),
);

const stockSearchFilter = makeSearchFilter<StockTableRow>(
  (item, query) => includesText(item.itemName, query) || includesText(item.unit, query),
);

const expenseSearchFilter = makeSearchFilter<ExpenseTableRow>(
  (expense, query) =>
    includesText(expense.description, query) || includesText(expense.loggedBy, query),
);

const visitSearchFilter = makeSearchFilter<VisitTableRow>((visit, query) =>
  includesText(visit.bed, query),
);

const chargeSearchFilter = makeSearchFilter<ChargeTableRow>((charge, query) =>
  includesText(charge.serviceName, query),
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

function ActionLinks({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1">{children}</div>;
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium whitespace-nowrap text-primary hover:underline">
      {children}
    </Link>
  );
}

function NoAction() {
  return <span className="text-muted-foreground">—</span>;
}

function actionsColumn<TData extends RowData>(
  render: (row: TData) => React.ReactNode,
  size = 120,
): ColumnDef<DataTableFeatures, TData> {
  return {
    id: "actions",
    header: "Action",
    cell: ({ row }) => render(row.original),
    enableSorting: false,
    enableHiding: false,
    size,
  };
}

function LatestVisitLabel({ label }: { label: string }) {
  const separator = " · ";
  const first = label.indexOf(separator);
  const second = first === -1 ? -1 : label.indexOf(separator, first + separator.length);
  if (second === -1) return label;
  return (
    <span className="flex min-w-0 flex-col whitespace-normal leading-5">
      <span>{label.slice(0, second)}</span>
      <span className="text-muted-foreground">{label.slice(second + separator.length)}</span>
    </span>
  );
}

export function PatientsTable({
  data,
  pageCount,
  dataMode,
  filterMode,
  canEdit = false,
}: {
  data: PatientTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
  canEdit?: boolean;
}) {
  const columns = React.useMemo<ColumnDef<DataTableFeatures, PatientTableRow>[]>(() => {
    const header = headers<PatientTableRow>();
    return [
      getDataTableSelectColumn(),
      searchColumn(
        "search",
        "Name, phone, or age",
        (row) => [row.name, row.phone ?? "", row.age ?? ""].join(" "),
        patientSearchFilter,
      ),
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
        cell: ({ row }) => row.original.phone || "—",
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
        cell: ({ row }) => <LatestVisitLabel label={row.original.latestVisit} />,
        meta: { label: "Latest visit" },
        enableSorting: false,
        enableColumnFilter: false,
        size: 240,
      },
      actionsColumn<PatientTableRow>(
        (patient) => (
          <ActionLinks>
            <ActionLink href={`/patients/${patient.id}`}>Open</ActionLink>
            {canEdit ? <ActionLink href={`/patients/${patient.id}/edit`}>Edit</ActionLink> : null}
          </ActionLinks>
        ),
        canEdit ? 132 : 84,
      ),
    ];
  }, [canEdit]);

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
      searchColumn(
        "search",
        "Name, specialty, or phone",
        (row) => [row.name, row.specialty ?? "", row.phone ?? ""].join(" "),
        doctorSearchFilter,
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
        id: "specialty",
        accessorKey: "specialty",
        header: header("Specialty"),
        cell: ({ row }) => row.original.specialty || "—",
        meta: { label: "Specialty" },
        size: 160,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: header("Phone"),
        cell: ({ row }) => row.original.phone || "—",
        meta: { label: "Phone" },
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
      actionsColumn<DoctorTableRow>(
        (doctor) => <ActionLink href={`/doctors/${doctor.id}/edit`}>Edit</ActionLink>,
        84,
      ),
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
      columnVisibility={{ search: false }}
    />
  );
}

export function StaffTable({
  data,
  pageCount,
  dataMode,
  filterMode,
  canEdit = false,
}: {
  data: StaffTableRow[];
  pageCount: number;
  dataMode: DataMode;
  filterMode: FilterMode;
  canEdit?: boolean;
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
      actionsColumn<StaffTableRow>((member) => {
        if (member.role === "ADMIN") {
          return <span className="text-muted-foreground">Full access</span>;
        }
        if (!canEdit) return <NoAction />;
        return (
          <ActionLinks>
            <ActionLink href={`/staff/${member.id}/edit`}>Details</ActionLink>
            <ActionLink href={`/staff/${member.id}`}>Permissions</ActionLink>
          </ActionLinks>
        );
      }, 180),
    ];
  }, [canEdit]);

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
      searchColumn(
        "search",
        "Item or unit",
        (row) => [row.itemName, row.unit].join(" "),
        stockSearchFilter,
      ),
      {
        id: "itemName",
        accessorKey: "itemName",
        header: header("Item"),
        cell: ({ row }) => <span className="font-medium">{row.original.itemName}</span>,
        meta: { label: "Item" },
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
            row.original.quantity
          ) : (
            <span>
              {row.original.quantity} {row.original.unit}
            </span>
          ),
        meta: { label: "Quantity", variant: "range", range: [0, 1000] },
        enableColumnFilter: true,
        size: 120,
      },
      {
        id: "unit",
        accessorKey: "unit",
        header: header("Unit"),
        meta: { label: "Unit" },
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
      actionsColumn<StockTableRow>(
        (item) => (manage ? <StockForm itemId={item.id} quantity={item.quantity} /> : <NoAction />),
        manage ? 220 : 84,
      ),
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
      columnVisibility={{ search: false }}
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
      searchColumn(
        "expenseSearch",
        "Description or name",
        (row) => [row.description, row.loggedBy].join(" "),
        expenseSearchFilter,
      ),
      {
        id: "description",
        accessorKey: "description",
        header: header("Description"),
        meta: { label: "Description" },
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
        meta: { label: "By" },
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
      actionsColumn<ExpenseTableRow>(() => <NoAction />, 84),
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
      columnVisibility={{ expenseSearch: false }}
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
      searchColumn("search", "Bed", (row) => row.bed ?? "", visitSearchFilter),
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
        meta: { label: "Bed" },
        size: 110,
      },
      actionsColumn<VisitTableRow>(
        (visit) => <ActionLink href={`/visits/${visit.id}`}>Open</ActionLink>,
        84,
      ),
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
      columnVisibility={{ search: false }}
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
      searchColumn("search", "Service", (row) => row.serviceName, chargeSearchFilter),
      {
        id: "serviceName",
        accessorKey: "serviceName",
        header: header("Service"),
        meta: { label: "Service" },
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
      actionsColumn<ChargeTableRow>(() => <NoAction />, 84),
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
      columnVisibility={{ search: false }}
    />
  );
}
