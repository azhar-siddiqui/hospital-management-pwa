"use client";

import { useActionState } from "react";
import { updateStaffAction } from "@/app/actions/users";
import { Field, FormMessage, SelectField } from "@/components/field";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { STAFF_ROLES, roleLabel } from "@/lib/roles";
import Link from "next/link";

export function EditStaffForm({
  staff,
}: {
  staff: { id: string; name: string; email: string; role: string };
}) {
  const [state, action, pending] = useActionState(updateStaffAction, idleState);

  return (
    <form action={action} className="min-w-0">
      <input type="hidden" name="userId" value={staff.id} />
      <Card className="w-full">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            name="name"
            required
            autoComplete="name"
            defaultValue={staff.name}
            error={state.errors?.name}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="off"
            defaultValue={staff.email}
            error={state.errors?.email}
          />
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="Leave blank to keep the current password."
            error={state.errors?.password}
          />
          <SelectField
            label="Role"
            name="role"
            defaultValue={staff.role}
            error={state.errors?.role}
            options={STAFF_ROLES.map((role) => ({ value: role, label: roleLabel(role) }))}
          />
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 sm:flex-1">
            <FormMessage message={state.message} ok={state.ok} />
          </div>
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
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
              {pending ? "Saving…" : "Save details"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
