"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import {
  addChargeAction,
  assignBedAction,
  createBedAction,
  createItemAction,
  dischargeVisitAction,
  logExpenseAction,
  registerPatientAction,
  saveNoteAction,
  setBedStatusAction,
  startVisitAction,
  updateStockAction,
} from "@/app/actions/hospital";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field as FieldRoot, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SelectField } from "@/components/field";
import { idleState } from "@/lib/action-state";
import { GENDERS, ITEM_CATEGORIES, WARD_LABELS, WARD_TYPES, type VisitTypeName } from "@/lib/validation";

const CHARGE_PRESETS = [
  { name: "ECG", price: "500" },
  { name: "Oxygen (Per Hour)", price: "200" },
  { name: "Blood Test", price: "300" },
];

export function RegisterPatientForm({ visitTypes }: { visitTypes: VisitTypeName[] }) {
  const [state, action, pending] = useActionState(registerPatientAction, idleState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" required autoComplete="name" error={state.errors?.name} />
      <Field label="Phone" name="phone" required inputMode="tel" autoComplete="tel" error={state.errors?.phone} />
      <Field label="Age" name="age" inputMode="numeric" error={state.errors?.age} />
      <SelectField
        label="Gender"
        name="gender"
        placeholder="Not specified"
        error={state.errors?.gender}
        options={GENDERS.map((gender) => ({ value: gender, label: gender }))}
      />
      <Field label="Address" name="address" error={state.errors?.address} className="sm:col-span-2" />
      <Field label="Referring doctor" name="referringDoctor" error={state.errors?.referringDoctor} />
      <Field label="Consultation fee (INR)" name="consultationFee" inputMode="decimal" defaultValue="0" error={state.errors?.consultationFee} />
      <VisitTypeField visitTypes={visitTypes} error={state.errors?.visitType} />
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Register patient"}
        </Button>
      </div>
    </form>
  );
}

export function StartVisitForm({
  patientId,
  visitTypes,
}: {
  patientId: string;
  visitTypes: VisitTypeName[];
}) {
  const [state, action, pending] = useActionState(startVisitAction, idleState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="patientId" value={patientId} />
      <Field label="Referring doctor" name="referringDoctor" error={state.errors?.referringDoctor} />
      <Field label="Consultation fee (INR)" name="consultationFee" inputMode="decimal" defaultValue="0" error={state.errors?.consultationFee} />
      <VisitTypeField visitTypes={visitTypes} error={state.errors?.visitType} />
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Start visit"}
        </Button>
      </div>
    </form>
  );
}

function VisitTypeField({ visitTypes, error }: { visitTypes: VisitTypeName[]; error?: string }) {
  if (visitTypes.length === 1) {
    return (
      <FieldRoot>
        <input type="hidden" name="visitType" value={visitTypes[0]} />
        <FieldDescription>Visit type: {visitTypes[0]}</FieldDescription>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldRoot>
    );
  }
  return (
    <SelectField
      label="Visit type"
      name="visitType"
      defaultValue={visitTypes[0]}
      error={error}
      options={visitTypes.map((type) => ({ value: type, label: type }))}
    />
  );
}

export function ClinicalNoteForm({ visitId, note }: { visitId: string; note: string }) {
  const [state, action, pending] = useActionState(saveNoteAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="visitId" value={visitId} />
      <FieldRoot data-invalid={state.errors?.clinicalNote ? true : undefined}>
        <FieldLabel htmlFor="clinicalNote">Clinical note</FieldLabel>
        <Textarea
          id="clinicalNote"
          name="clinicalNote"
          defaultValue={note}
          rows={5}
          maxLength={4000}
          aria-invalid={state.errors?.clinicalNote ? true : undefined}
        />
        {state.errors?.clinicalNote ? <FieldError>{state.errors.clinicalNote}</FieldError> : null}
      </FieldRoot>
      <div className="flex items-center justify-between gap-3">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </form>
  );
}

const PRESET_OPTIONS = [
  { value: "custom", label: "Custom" },
  ...CHARGE_PRESETS.map((item) => ({ value: item.name, label: item.name })),
];

export function ChargeForm({ visitId }: { visitId: string }) {
  const [state, action, pending] = useActionState(addChargeAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const [preset, setPreset] = useState<string | null>("custom");

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onReset = () => setPreset("custom");
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="visitId" value={visitId} />
      <FieldRoot className="sm:col-span-3">
        <FieldLabel htmlFor="preset">Common charge</FieldLabel>
        <Select
          value={preset}
          onValueChange={(next) => {
            setPreset(next);
            const match = CHARGE_PRESETS.find((item) => item.name === next);
            const form = formRef.current;
            if (!form || !match) return;
            const name = form.elements.namedItem("serviceName");
            const price = form.elements.namedItem("unitPrice");
            if (name instanceof HTMLInputElement) name.value = match.name;
            if (price instanceof HTMLInputElement) price.value = match.price;
          }}
          items={PRESET_OPTIONS}
        >
          <SelectTrigger id="preset" className="w-full min-w-0">
            <SelectValue className="min-w-0" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRoot>
      <Field label="Service" name="serviceName" required error={state.errors?.serviceName} />
      <Field label="Quantity" name="quantity" required inputMode="numeric" defaultValue="1" error={state.errors?.quantity} />
      <Field label="Unit price (INR)" name="unitPrice" required inputMode="decimal" error={state.errors?.unitPrice} />
      <div className="flex flex-col gap-2 sm:col-span-3 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add charge"}
        </Button>
      </div>
    </form>
  );
}

export function DischargeForm({ visitId }: { visitId: string }) {
  const [state, action, pending] = useActionState(dischargeVisitAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="visitId" value={visitId} />
      <FieldRoot orientation="horizontal" className="items-start">
        <Checkbox id="confirm-discharge" name="confirm" value="on" required />
        <FieldLabel htmlFor="confirm-discharge">
          Confirm this visit is ready for discharge. The bed will be freed.
        </FieldLabel>
      </FieldRoot>
      <FormMessage message={state.message} ok={state.ok} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Discharging…" : "Discharge"}
      </Button>
    </form>
  );
}

export function AssignBedForm({
  visitId,
  beds,
}: {
  visitId: string;
  beds: Array<{ id: string; bedNumber: string; wardType: string }>;
}) {
  const [state, action, pending] = useActionState(assignBedAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="visitId" value={visitId} />
      <SelectField
        label="Available bed"
        name="bedId"
        required
        disabled={beds.length === 0}
        placeholder="Choose a bed"
        options={beds.map((bed) => ({
          value: bed.id,
          label: `${bed.bedNumber} · ${WARD_LABELS[bed.wardType as keyof typeof WARD_LABELS] ?? bed.wardType}`,
        }))}
      />
      <FormMessage message={state.message} ok={state.ok} />
      <Button type="submit" disabled={pending || beds.length === 0}>
        {pending ? "Assigning…" : "Assign bed"}
      </Button>
    </form>
  );
}

export function CreateBedForm() {
  const [state, action, pending] = useActionState(createBedAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Bed number" name="bedNumber" required error={state.errors?.bedNumber} />
      <SelectField
        label="Ward"
        name="wardType"
        defaultValue="GENERAL"
        error={state.errors?.wardType}
        options={WARD_TYPES.map((ward) => ({ value: ward, label: WARD_LABELS[ward] }))}
      />
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add bed"}
        </Button>
      </div>
    </form>
  );
}

export function BedStatusForm({ bedId, status }: { bedId: string; status: "AVAILABLE" | "MAINTENANCE" }) {
  const [state, action, pending] = useActionState(setBedStatusAction, idleState);
  const next = status === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE";
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="bedId" value={bedId} />
      <input type="hidden" name="status" value={next} />
      <Button type="submit" variant="outline" disabled={pending}>
        {next === "MAINTENANCE" ? "Mark maintenance" : "Mark available"}
      </Button>
      <FormMessage message={state.message} ok={state.ok} />
    </form>
  );
}

export function CreateItemForm() {
  const [state, action, pending] = useActionState(createItemAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Item" name="itemName" required error={state.errors?.itemName} />
      <SelectField
        label="Category"
        name="category"
        defaultValue="Medicine"
        error={state.errors?.category}
        options={ITEM_CATEGORIES.map((category) => ({ value: category, label: category }))}
      />
      <Field label="Unit" name="unit" required placeholder="Pieces" error={state.errors?.unit} />
      <Field label="Quantity" name="quantity" required inputMode="numeric" defaultValue="0" error={state.errors?.quantity} />
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add item"}
        </Button>
      </div>
    </form>
  );
}

export function StockForm({ itemId, quantity }: { itemId: string; quantity: number }) {
  const [state, action, pending] = useActionState(updateStockAction, idleState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <FieldLabel className="sr-only" htmlFor={`qty-${itemId}`}>
        Quantity
      </FieldLabel>
      <Input
        id={`qty-${itemId}`}
        name="quantity"
        inputMode="numeric"
        defaultValue={quantity}
        className="w-20"
      />
      <Button type="submit" variant="outline" disabled={pending}>
        Save
      </Button>
      <FormMessage message={state.message} ok={state.ok} />
    </form>
  );
}

export function ExpenseForm() {
  const [state, action, pending] = useActionState(logExpenseAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Description" name="description" required error={state.errors?.description} />
      <Field label="Amount (INR)" name="amount" required inputMode="decimal" error={state.errors?.amount} />
      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record expense"}
        </Button>
      </div>
    </form>
  );
}

export function PrintButton() {
  return (
    <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
      Print receipt
    </Button>
  );
}
