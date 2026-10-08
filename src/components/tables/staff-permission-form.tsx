"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { updateStaffPermissions } from "@/app/actions/staff";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { idleState } from "@/lib/action-state";
import { PERMISSION_GROUPS, PERMISSIONS, type Permission } from "@/lib/permissions";

export function StaffPermissionForm({
  userId,
  assigned,
}: {
  userId: string;
  assigned: readonly Permission[];
}) {
  const [selected, setSelected] = useState<Permission[]>([...assigned]);
  const [state, action, pending] = useActionState(updateStaffPermissions, idleState);

  function toggle(permission: Permission, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(permission);
      else next.delete(permission);
      return PERMISSIONS.filter((item) => next.has(item));
    });
  }

  return (
    <form
      action={action}
      aria-label="Permissions"
      className="flex w-full max-w-2xl min-w-0 flex-col gap-6"
    >
      <input type="hidden" name="userId" value={userId} />
      {selected.map((permission) => (
        <input key={permission} type="hidden" name="permissions" value={permission} />
      ))}
      {PERMISSION_GROUPS.map((group) => (
        <div
          key={group.label}
          role="group"
          aria-label={group.label}
          className="flex flex-col gap-2 border-b border-border pb-6 last:border-b-0 last:pb-0"
        >
          <div>
            <p className="text-sm font-medium">{group.label}</p>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>
          {group.items.map((item) => (
            <label key={item.permission} className="flex items-start gap-2">
              <Checkbox
                className="mt-0.5"
                checked={selected.includes(item.permission)}
                onCheckedChange={(checked) => toggle(item.permission, checked === true)}
                aria-label={item.label}
                disabled={pending}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs break-words text-muted-foreground">
                  {item.detail}
                </span>
              </span>
            </label>
          ))}
        </div>
      ))}
      {state.message && !state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className="scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="outline"
          className="scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0"
          nativeButton={false}
          render={<Link href="/staff" />}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
