"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { updateStaffPermissions } from "@/app/actions/staff";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { idleState } from "@/lib/action-state";
import {
  PERMISSION_MATRIX,
  PERMISSION_MATRIX_COLUMNS,
  permissionMatrixMinWidth,
  permissionsInCells,
  permissionsInColumn,
  type PermissionMatrixColumn,
} from "@/lib/permission-matrix";
import { PERMISSIONS, permissionLabel, type Permission } from "@/lib/permissions";

const scrollClearance = "scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0";

export function StaffPermissionForm({
  userId,
  name,
  assigned,
}: {
  userId: string;
  name: string;
  assigned: readonly Permission[];
}) {
  const [selected, setSelected] = useState<Permission[]>([...assigned]);
  const [state, action, pending] = useActionState(updateStaffPermissions, idleState);
  const selectedSet = new Set(selected);

  function selectionState(permissions: readonly Permission[]) {
    const count = permissions.filter((permission) => selectedSet.has(permission)).length;
    return {
      checked: permissions.length > 0 && count === permissions.length,
      indeterminate: count > 0 && count < permissions.length,
    };
  }

  function setMany(permissions: readonly Permission[], checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const permission of permissions) {
        if (checked) next.add(permission);
        else next.delete(permission);
      }
      return PERMISSIONS.filter((permission) => next.has(permission));
    });
  }

  function toggle(permission: Permission, checked: boolean) {
    setMany([permission], checked);
  }

  return (
    <form action={action} aria-label="Permissions" className="flex w-full min-w-0 flex-col gap-6">
      <input type="hidden" name="userId" value={userId} />
      {selected.map((permission) => (
        <input key={permission} type="hidden" name="permissions" value={permission} />
      ))}
      <section className="min-w-0 overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="border-b px-4 py-4 sm:px-5">
          <h2 className="text-sm font-medium">Role & access</h2>
          <p className="mt-1 max-w-3xl text-sm wrap-break-word text-muted-foreground">
            Choose what {name} can use. Only Manage staff opens a screen today.
          </p>
        </div>
        <div className="overflow-x-auto" data-slot="table-container">
          <table
            className="w-full border-collapse text-sm"
            style={{ minWidth: permissionMatrixMinWidth }}
          >
            <caption className="sr-only">Permissions for {name}</caption>
            <thead>
              <tr className="border-b bg-muted">
                <th
                  scope="col"
                  className="sticky left-0 z-20 border-r bg-muted px-3 text-left font-medium"
                  style={{ minWidth: 180 }}
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
                    <th
                      key={column.id}
                      scope="col"
                      className="px-2 text-center font-medium"
                      style={{ width: 112 }}
                    >
                      <span className="flex h-11 items-center justify-center gap-2">
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
                      className="sticky left-0 z-10 border-r bg-card px-3 text-left font-medium"
                      style={{ minWidth: 180 }}
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
                        <td key={column.id} className="px-2 text-center" style={{ width: 112 }}>
                          {permission ? (
                            <span className="inline-flex h-11 items-center justify-center">
                              <Checkbox
                                checked={selectedSet.has(permission)}
                                onCheckedChange={(checked) => toggle(permission, checked === true)}
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
      {state.message && !state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          className={scrollClearance}
          nativeButton={false}
          render={<Link href="/staff" />}
        >
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className={scrollClearance}
            nativeButton={false}
            render={<Link href="/staff" />}
          >
            Cancel
          </Button>
          <Button type="submit" className={scrollClearance} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </form>
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
