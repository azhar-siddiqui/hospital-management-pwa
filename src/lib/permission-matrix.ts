import { PERMISSIONS, type Permission } from "@/lib/permissions";

export const PERMISSION_MATRIX_COLUMNS = [
  { id: "view", label: "View" },
  { id: "create", label: "Create" },
  { id: "update", label: "Update" },
  { id: "discharge", label: "Discharge" },
] as const;

export type PermissionMatrixColumn = (typeof PERMISSION_MATRIX_COLUMNS)[number]["id"];

export const PERMISSION_MATRIX = [
  { label: "Patients", cells: { view: "patients:view", create: "patients:register" } },
  { label: "Outpatient", cells: { create: "visits:opd" } },
  {
    label: "Inpatient",
    cells: { create: "visits:admit", update: "visits:note", discharge: "visits:discharge" },
  },
  { label: "Visit charge", cells: { create: "visits:charge" } },
  { label: "Beds", cells: { view: "beds:view", update: "beds:manage" } },
  { label: "Stock", cells: { view: "inventory:view", update: "inventory:manage" } },
  { label: "Expenses", cells: { view: "expenses:view", create: "expenses:create" } },
  { label: "Fee report", cells: { view: "reports:fees" } },
  { label: "Charge report", cells: { view: "reports:charges" } },
  { label: "Expense report", cells: { view: "reports:expenses" } },
  { label: "Collection", cells: { view: "reports:collection" } },
  { label: "Staff", cells: { update: "staff:manage" } },
  { label: "Doctors", cells: { update: "doctors:manage" } },
  { label: "Edit log", cells: { view: "activity:view" } },
] as const satisfies readonly {
  label: string;
  cells: Partial<Record<PermissionMatrixColumn, Permission>>;
}[];

type RowPermissions<Row> = Row extends { cells: infer Cells }
  ? NonNullable<Cells[keyof Cells]>
  : never;
type PlacedPermission = RowPermissions<(typeof PERMISSION_MATRIX)[number]>;
type MissingPermission = Exclude<Permission, PlacedPermission>;
const everyPermissionPlaced: [MissingPermission] extends [never] ? true : MissingPermission = true;
void everyPermissionPlaced;

const placedPermissions = PERMISSION_MATRIX.flatMap((row) =>
  PERMISSION_MATRIX_COLUMNS.flatMap((column) => {
    const permission = (row.cells as Partial<Record<PermissionMatrixColumn, Permission>>)[
      column.id
    ];
    return permission ? [permission] : [];
  }),
);
if (
  new Set(placedPermissions).size !== placedPermissions.length ||
  placedPermissions.length !== PERMISSIONS.length
) {
  throw new Error("The permission matrix must list each permission once.");
}

export function permissionsInCells(
  cells:
    | Partial<Record<PermissionMatrixColumn, Permission>>
    | (typeof PERMISSION_MATRIX)[number]["cells"],
) {
  const record = cells as Partial<Record<PermissionMatrixColumn, Permission>>;
  return PERMISSION_MATRIX_COLUMNS.flatMap((column) => {
    const permission = record[column.id];
    return permission ? [permission] : [];
  });
}

export function permissionsInColumn(columnId: PermissionMatrixColumn) {
  return PERMISSION_MATRIX.flatMap((row) => {
    const permission = (row.cells as Partial<Record<PermissionMatrixColumn, Permission>>)[columnId];
    return permission ? [permission] : [];
  });
}

export const permissionMatrixModuleWidth = 300;
export const permissionMatrixMinWidth =
  permissionMatrixModuleWidth + PERMISSION_MATRIX_COLUMNS.length * 112;
