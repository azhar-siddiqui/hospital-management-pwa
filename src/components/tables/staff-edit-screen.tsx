"use client";

import { StaffEditForm } from "@/components/tables/staff-edit-form";
import type { Permission } from "@/lib/permissions";
import type { StaffRole } from "@/lib/roles";

export function StaffEditScreen({
  userId,
  name,
  email,
  role,
  assigned,
}: {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  assigned: readonly Permission[];
}) {
  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Edit staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Update the account and what it can use.
        </p>
      </div>
      <StaffEditForm
        key={userId}
        userId={userId}
        name={name}
        email={email}
        role={role}
        assigned={assigned}
      />
    </main>
  );
}
