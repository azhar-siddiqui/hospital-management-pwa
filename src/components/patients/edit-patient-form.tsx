"use client";

import { useActionState } from "react";
import { updatePatientAction } from "@/app/actions/hospital";
import { Field, FormMessage, SelectField } from "@/components/field";
import { idleState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { GENDERS } from "@/lib/validation";
import Link from "next/link";

export function EditPatientForm({
  patient,
}: {
  patient: {
    id: string;
    name: string;
    phone: string;
    age: number | null;
    gender: string | null;
    address: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updatePatientAction, idleState);

  return (
    <form action={action} className="min-w-0">
      <input type="hidden" name="patientId" value={patient.id} />
      <Card className="w-full">
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            name="name"
            required
            autoComplete="name"
            defaultValue={patient.name}
            error={state.errors?.name}
          />
          <Field
            label="Phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            defaultValue={patient.phone}
            error={state.errors?.phone}
          />
          <Field
            label="Age"
            name="age"
            inputMode="numeric"
            defaultValue={patient.age === null ? "" : String(patient.age)}
            error={state.errors?.age}
          />
          <SelectField
            label="Gender"
            name="gender"
            defaultValue={patient.gender ?? "unspecified"}
            error={state.errors?.gender}
            options={[
              { value: "unspecified", label: "Not specified" },
              ...GENDERS.map((gender) => ({ value: gender, label: gender })),
            ]}
          />
          <Field
            label="Address"
            name="address"
            defaultValue={patient.address ?? ""}
            placeholder="Street, area, city"
            error={state.errors?.address}
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
              render={<Link href={`/patients/${patient.id}`} />}
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
