"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconDotsVertical } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS, permissionLabel } from "@/lib/permissions";
import { beginStaffEdit } from "@/lib/staff-account-cache";

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
  email,
  role,
  permissions,
  locked,
}: {
  userId: string;
  name: string;
  email: string;
  role: string;
  permissions: readonly string[];
  locked: boolean;
}) {
  const router = useRouter();
  if (locked) return null;

  const href = `/staff/${userId}`;
  const account = { id: userId, name, email, role, permissions };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) router.prefetch(href);
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} />
        }
      >
        <IconDotsVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={<Link href={href} prefetch={true} onClick={() => beginStaffEdit(account)} />}
        >
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
