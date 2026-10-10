"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { updateStaffPermissions } from "@/app/actions/staff";
import { StaffPermissionMatrix } from "@/components/tables/staff-permission-matrix";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { idleState } from "@/lib/action-state";
import type { Permission } from "@/lib/permissions";
import { IconArrowLeft } from "@tabler/icons-react";

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

  return (
    <form action={action} aria-label="Permissions" className="flex w-full min-w-0 flex-col gap-6">
      <input type="hidden" name="userId" value={userId} />
      {selected.map((permission) => (
        <input key={permission} type="hidden" name="permissions" value={permission} />
      ))}
      <StaffPermissionMatrix
        subject={name}
        selected={selected}
        onSelectedChange={setSelected}
        pending={pending}
      />
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
          <IconArrowLeft data-icon="inline-start" /> Back
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
