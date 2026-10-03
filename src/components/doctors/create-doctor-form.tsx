"use client";

import { useActionState, useEffect, useRef } from "react";
import { createDoctorAction } from "@/app/actions/doctors";
import { Field, FormMessage } from "@/components/field";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";

export function CreateDoctorForm() {
  const [state, action, pending] = useActionState(createDoctorAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" required autoComplete="name" error={state.errors?.name} />
      <Field label="Specialty" name="specialty" error={state.errors?.specialty} />
      <Field label="Phone" name="phone" inputMode="tel" autoComplete="tel" error={state.errors?.phone} />
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add doctor"}
        </Button>
      </div>
    </form>
  );
}
