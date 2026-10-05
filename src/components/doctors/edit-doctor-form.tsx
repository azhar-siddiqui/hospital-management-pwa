"use client";

import { useActionState } from "react";
import { updateDoctorAction } from "@/app/actions/doctors";
import { Field, FormMessage } from "@/components/field";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";

export function EditDoctorForm({
  doctor,
}: {
  doctor: { id: string; name: string; specialty: string | null; phone: string | null };
}) {
  const [state, action, pending] = useActionState(updateDoctorAction, idleState);

  return (
    <form action={action} className="min-w-0">
      <input type="hidden" name="doctorId" value={doctor.id} />
      <Card className="w-full">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            name="name"
            required
            autoComplete="name"
            defaultValue={doctor.name}
            error={state.errors?.name}
          />
          <Field
            label="Specialty"
            name="specialty"
            defaultValue={doctor.specialty ?? ""}
            placeholder="For example, MBBS"
            error={state.errors?.specialty}
          />
          <Field
            label="Phone"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={doctor.phone ?? ""}
            placeholder="Mobile number"
            error={state.errors?.phone}
            className="sm:col-span-2"
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
              render={<Link href="/doctors" />}
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
