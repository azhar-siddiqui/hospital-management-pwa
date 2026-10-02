"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, type CreateUserState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { STAFF_ROLES, roleLabel } from "@/lib/roles";

const initialState: CreateUserState = { ok: false };

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input id="name" name="name" required autoComplete="name" className={fieldClass} />
        {state.errors?.name ? <p className="text-sm text-destructive">{state.errors.name}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="staff-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="staff-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className={fieldClass}
        />
        {state.errors?.email ? <p className="text-sm text-destructive">{state.errors.email}</p> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="staff-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
        {state.errors?.password ? (
          <p className="text-sm text-destructive">{state.errors.password}</p>
        ) : (
          <p className="text-xs text-muted-foreground">At least 8 characters. Share it with the staff member.</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium">
          Role
        </label>
        <select id="role" name="role" required defaultValue="RECEPTIONIST" className={fieldClass}>
          {STAFF_ROLES.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </select>
        {state.errors?.role ? <p className="text-sm text-destructive">{state.errors.role}</p> : null}
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        {state.message ? (
          <p className="text-sm text-foreground" role="status">
            {state.message}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Admin accounts are not created here.</p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
