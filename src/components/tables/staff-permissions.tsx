"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { IconDotsVertical } from "@tabler/icons-react";

import { updateStaffPermissions } from "@/app/actions/staff";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { idleState } from "@/lib/action-state";
import {
  PERMISSION_GROUPS,
  PERMISSIONS,
  permissionLabel,
  type Permission,
} from "@/lib/permissions";

export function StaffPermissionCell({
  permissions,
  locked,
}: {
  permissions: readonly string[];
  locked: boolean;
}) {
  const assigned = PERMISSIONS.filter((permission) => permissions.includes(permission));

  return (
    <div className="flex max-w-full flex-wrap items-center gap-1 whitespace-normal">
      {locked ? <Badge variant="secondary">All</Badge> : null}
      {!locked && assigned.length === 0 ? (
        <span className="text-muted-foreground">None</span>
      ) : null}
      {!locked
        ? assigned.map((permission) => (
            <Badge key={permission} variant="secondary">
              {permissionLabel(permission)}
            </Badge>
          ))
        : null}
    </div>
  );
}

export function StaffRowActions({
  userId,
  name,
  permissions,
  locked,
}: {
  userId: string;
  name: string;
  permissions: readonly string[];
  locked: boolean;
}) {
  const assigned = PERMISSIONS.filter((permission) => permissions.includes(permission));
  const [open, setOpen] = useState(false);

  if (locked) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${name}`}
            />
          }
        >
          <IconDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              window.setTimeout(() => setOpen(true), 0);
            }}
          >
            Change
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StaffPermissionDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        name={name}
        assigned={assigned}
      />
    </>
  );
}

function StaffPermissionDialog({
  open,
  onOpenChange,
  userId,
  name,
  assigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  name: string;
  assigned: readonly Permission[];
}) {
  const labelId = useId();
  const assignedRef = useRef(assigned);
  const [selected, setSelected] = useState<Permission[]>([...assigned]);
  const [state, action, pending] = useActionState(updateStaffPermissions, idleState);

  assignedRef.current = assigned;

  useEffect(() => {
    if (open) setSelected([...assignedRef.current]);
  }, [open]);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state, onOpenChange]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) setSelected([...assigned]);
  }

  function toggle(permission: Permission, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(permission);
      else next.delete(permission);
      return PERMISSIONS.filter((item) => next.has(item));
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Permissions for {name}</DialogTitle>
          <DialogDescription>Choose every area this account can use.</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          {selected.map((permission) => (
            <input key={permission} type="hidden" name="permissions" value={permission} />
          ))}
          <div
            role="group"
            aria-labelledby={labelId}
            className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto"
          >
            <p id={labelId} className="sr-only">
              Permissions
            </p>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <div>
                  <p className="text-sm font-medium">{group.label}</p>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
                {group.items.map((item) => (
                  <label key={item.permission} className="flex items-start gap-2">
                    <Checkbox
                      checked={selected.includes(item.permission)}
                      onCheckedChange={(checked) => toggle(item.permission, checked)}
                      aria-label={item.label}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          {state.message && !state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
