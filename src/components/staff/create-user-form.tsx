"use client";

import { useActionState } from "react";
import { createUser, type CreateUserState } from "@/app/actions/users";
import { Field, FormMessage, SelectField } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { STAFF_ROLES, roleLabel } from "@/lib/roles";
import Link from "next/link";

const initialState: CreateUserState = { ok: false };

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, initialState);

  return (
    <form action={action} className="min-w-0">
      <Card className="w-full">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required autoComplete="name" error={state.errors?.name} />
          <Field
            label="Email"
            name="email"
            id="staff-email"
            type="email"
            required
            autoComplete="off"
            error={state.errors?.email}
          />
          <Field
            label="Password"
            name="password"
            id="staff-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters. Share it with the staff member."
            error={state.errors?.password}
          />
          <SelectField
            label="Role"
            name="role"
            defaultValue="RECEPTIONIST"
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
              {pending ? "Adding…" : "Add staff"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
