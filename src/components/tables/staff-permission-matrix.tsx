"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  PERMISSION_MATRIX,
  PERMISSION_MATRIX_COLUMNS,
  permissionMatrixMinWidth,
  permissionMatrixModuleWidth,
  permissionsInCells,
  permissionsInColumn,
  type PermissionMatrixColumn,
} from "@/lib/permission-matrix";
import { PERMISSIONS, permissionLabel, type Permission } from "@/lib/permissions";

export function StaffPermissionMatrix({
  subject,
  selected,
  onSelectedChange,
  pending,
}: {
  subject: string;
  selected: readonly Permission[];
  onSelectedChange: (next: Permission[]) => void;
  pending: boolean;
}) {
  const selectedSet = new Set(selected);

  function selectionState(permissions: readonly Permission[]) {
    const count = permissions.filter((permission) => selectedSet.has(permission)).length;
    return {
      checked: permissions.length > 0 && count === permissions.length,
      indeterminate: count > 0 && count < permissions.length,
    };
  }

  function setMany(permissions: readonly Permission[], checked: boolean) {
    const next = new Set(selected);
    for (const permission of permissions) {
      if (checked) next.add(permission);
      else next.delete(permission);
    }
    onSelectedChange(PERMISSIONS.filter((permission) => next.has(permission)));
  }

  return (
    <section className="min-w-0 rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
      <div className="border-b px-4 py-4 sm:px-5">
        <h2 className="text-sm font-medium">Role & access</h2>
        <p className="mt-1 max-w-3xl text-sm wrap-break-word text-muted-foreground">
          Choose what {subject} can use. Only Manage staff opens a screen today.
        </p>
      </div>
      <div className="xl:hidden">
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 border-b bg-muted">
          <div className="flex h-11 items-center gap-2 px-4">
            <MatrixCheck
              label="All permissions"
              permissions={PERMISSIONS}
              state={selectionState(PERMISSIONS)}
              pending={pending}
              onChange={(checked) => setMany(PERMISSIONS, checked)}
            />
            <span className="text-sm font-medium">All permissions</span>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
            {PERMISSION_MATRIX_COLUMNS.map((column) => {
              const permissions = permissionsInColumn(column.id);
              return (
                <div key={column.id} className="flex min-w-0 flex-col items-center px-1 py-2">
                  <span className="max-w-full text-center text-xs leading-tight font-medium">
                    {column.label}
                  </span>
                  <span className="flex h-11 items-center justify-center">
                    <MatrixCheck
                      label={`All ${column.label} permissions`}
                      permissions={permissions}
                      state={selectionState(permissions)}
                      pending={pending}
                      onChange={(checked) => setMany(permissions, checked)}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {PERMISSION_MATRIX.map((row) => {
          const permissions = permissionsInCells(row.cells);
          return (
            <div key={row.label} className="border-b last:border-b-0">
              <div className="flex h-11 items-center gap-2 px-4">
                <MatrixCheck
                  label={`All ${row.label} permissions`}
                  permissions={permissions}
                  state={selectionState(permissions)}
                  pending={pending}
                  onChange={(checked) => setMany(permissions, checked)}
                />
                <span className="min-w-0 truncate text-sm font-medium">{row.label}</span>
              </div>
              <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
                {PERMISSION_MATRIX_COLUMNS.map((column) => {
                  const permission = cellPermission(row.cells, column.id);
                  return (
                    <div key={column.id} className="flex h-11 items-center justify-center">
                      {permission ? (
                        <Checkbox
                          checked={selectedSet.has(permission)}
                          onCheckedChange={(checked) => setMany([permission], checked === true)}
                          aria-label={permissionLabel(permission)}
                          disabled={pending}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto xl:block" data-slot="table-container">
        <table
          className="w-full border-collapse text-sm"
          style={{ tableLayout: "fixed", minWidth: permissionMatrixMinWidth }}
        >
          <caption className="sr-only">Permissions for {subject}</caption>
          <colgroup>
            <col style={{ width: permissionMatrixModuleWidth }} />
            {PERMISSION_MATRIX_COLUMNS.map((column) => (
              <col key={column.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b bg-muted">
              <th
                scope="col"
                className="sticky left-0 z-10 border-r bg-muted px-6 text-left font-medium whitespace-nowrap"
                style={{ width: permissionMatrixModuleWidth }}
              >
                <span className="flex h-11 items-center gap-2">
                  <MatrixCheck
                    label="All permissions"
                    permissions={PERMISSIONS}
                    state={selectionState(PERMISSIONS)}
                    pending={pending}
                    onChange={(checked) => setMany(PERMISSIONS, checked)}
                  />
                  Module
                </span>
              </th>
              {PERMISSION_MATRIX_COLUMNS.map((column) => {
                const permissions = permissionsInColumn(column.id);
                return (
                  <th key={column.id} scope="col" className="border-r px-6 text-left font-medium">
                    <span className="flex h-11 items-center justify-start gap-2">
                      <MatrixCheck
                        label={`All ${column.label} permissions`}
                        permissions={permissions}
                        state={selectionState(permissions)}
                        pending={pending}
                        onChange={(checked) => setMany(permissions, checked)}
                      />
                      {column.label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map((row) => {
              const permissions = permissionsInCells(row.cells);
              return (
                <tr key={row.label} className="border-b last:border-b-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r bg-card px-6 text-left font-medium whitespace-nowrap"
                    style={{ width: permissionMatrixModuleWidth }}
                  >
                    <span className="flex h-11 items-center gap-2">
                      <MatrixCheck
                        label={`All ${row.label} permissions`}
                        permissions={permissions}
                        state={selectionState(permissions)}
                        pending={pending}
                        onChange={(checked) => setMany(permissions, checked)}
                      />
                      {row.label}
                    </span>
                  </th>
                  {PERMISSION_MATRIX_COLUMNS.map((column) => {
                    const permission = cellPermission(row.cells, column.id);
                    return (
                      <td key={column.id} className="border-r px-6 text-left">
                        {permission ? (
                          <span className="inline-flex h-11 items-center justify-center">
                            <Checkbox
                              checked={selectedSet.has(permission)}
                              onCheckedChange={(checked) => setMany([permission], checked === true)}
                              aria-label={permissionLabel(permission)}
                              disabled={pending}
                            />
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function cellPermission(
  cells: (typeof PERMISSION_MATRIX)[number]["cells"],
  column: PermissionMatrixColumn,
) {
  return (cells as Partial<Record<PermissionMatrixColumn, Permission>>)[column];
}

function MatrixCheck({
  label,
  permissions,
  state,
  pending,
  onChange,
}: {
  label: string;
  permissions: readonly Permission[];
  state: { checked: boolean; indeterminate: boolean };
  pending: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      checked={state.checked}
      indeterminate={state.indeterminate}
      onCheckedChange={(checked) => onChange(checked === true)}
      aria-label={label}
      disabled={pending || permissions.length === 0}
    />
  );
}
