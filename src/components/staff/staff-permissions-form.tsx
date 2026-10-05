"use client";

import { updateStaffPermissions } from "@/app/actions/users";
import { FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { idleState } from "@/lib/action-state";
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  IconBed,
  IconPackage,
  IconReceipt,
  IconReportMoney,
  IconStethoscope,
  IconUserCog,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ComponentType } from "react";

const groupIcons = {
  Patients: IconUsers,
  Visits: IconStethoscope,
  Beds: IconBed,
  Inventory: IconPackage,
  Expenses: IconReceipt,
  Reports: IconReportMoney,
  Administration: IconUserCog,
} satisfies Record<
  (typeof PERMISSION_GROUPS)[number]["label"],
  ComponentType<{ className?: string }>
>;

function samePermissions(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left.size !== right.size) return false;
  for (const permission of left) {
    if (!right.has(permission)) return false;
  }
  return true;
}

export function StaffPermissionsForm({
  userId,
  permissions,
}: {
  userId: string;
  permissions: readonly string[];
}) {
  const [state, action, pending] = useActionState(updateStaffPermissions, idleState);
  const [forUser, setForUser] = useState(userId);
  const [selected, setSelected] = useState(() => new Set(permissions));
  const [saved, setSaved] = useState(() => new Set(permissions));
  const submitted = useRef<ReadonlySet<string> | null>(null);

  if (forUser !== userId) {
    setForUser(userId);
    setSelected(new Set(permissions));
    setSaved(new Set(permissions));
  }

  useEffect(() => {
    submitted.current = null;
  }, [userId]);

  useEffect(() => {
    if (!state.ok || !submitted.current) return;
    setSaved(submitted.current);
    submitted.current = null;
  }, [state]);

  const dirty = !samePermissions(selected, saved);
  const enabledCount = PERMISSIONS.filter((permission) => selected.has(permission)).length;

  function setPermission(permission: string, on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(permission);
      else next.delete(permission);
      return next;
    });
  }

  function setGroup(items: readonly { permission: string }[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const item of items) {
        if (on) next.add(item.permission);
        else next.delete(item.permission);
      }
      return next;
    });
  }

  return (
    <form
      action={action}
      className="flex min-w-0 flex-col gap-4"
      onSubmit={() => {
        submitted.current = new Set(selected);
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {enabledCount} of {PERMISSIONS.length} on
          </p>
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center rounded-4xl px-2 text-xs font-medium",
              dirty
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {dirty ? "Unsaved" : "Saved"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {dirty ? "Unsaved changes. " : "Matches the saved access. "}
          Checked rows are allowed. Save replaces this set. The home screen stays available, and the
          role name does not change.
        </p>
      </div>

      {PERMISSION_GROUPS.map((group) => {
        const Icon = groupIcons[group.label];
        const onCount = group.items.filter((item) => selected.has(item.permission)).length;
        const allOn = onCount === group.items.length;
        return (
          <section key={group.label} className="min-w-0 rounded-xl border bg-card">
            <div className="flex gap-3 border-b px-4 py-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h2 className="text-sm font-medium">{group.label}</h2>
                  <p className="text-xs text-muted-foreground">
                    {onCount} of {group.items.length} on
                  </p>
                </div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{group.description}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  aria-label={`${allOn ? "Turn off" : "Turn on"} every ${group.label} permission`}
                  onClick={() => setGroup(group.items, !allOn)}
                >
                  {allOn ? "Turn all off" : "Turn all on"}
                </Button>
              </div>
            </div>
            <ul className="grid gap-2 p-3">
              {group.items.map((item) => {
                const id = `${userId}-${item.permission}`;
                const on = selected.has(item.permission);
                return (
                  <li key={item.permission}>
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3 py-3",
                        on ? "border-primary/40 bg-primary/5" : "border-border",
                      )}
                    >
                      <Label
                        htmlFor={id}
                        className="min-w-0 flex-1 flex-col items-start gap-1 leading-5"
                      >
                        <span>{item.label}</span>
                        <span className="text-sm leading-5 font-normal text-muted-foreground">
                          {item.detail}
                        </span>
                      </Label>
                      <Checkbox
                        id={id}
                        className="mt-0.5 shrink-0"
                        name="permissions"
                        value={item.permission}
                        checked={on}
                        onCheckedChange={(checked) => setPermission(item.permission, checked)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
        <FormMessage message={state.message} ok={state.ok} />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            nativeButton={false}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            render={<Link href="/staff" />}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save permissions"}
          </Button>
        </div>
      </div>
    </form>
  );
}
