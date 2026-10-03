"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, type CreateUserState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { Field, FormMessage, SelectField } from "@/components/field";
import { STAFF_ROLES, roleLabel } from "@/lib/roles";

const initialState: CreateUserState = { ok: false };

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
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
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        {state.message ? (
          <FormMessage message={state.message} ok />
        ) : (
          <FieldDescription>Admin accounts are not created here.</FieldDescription>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
