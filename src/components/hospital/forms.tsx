"use client";

import { useActionState, useEffect, useRef } from "react";
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
import { Field, FormMessage, SelectField, fieldClass } from "@/components/field";
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
      <SelectField label="Gender" name="gender" defaultValue="" error={state.errors?.gender}>
        <option value="">Not specified</option>
        {GENDERS.map((gender) => (
          <option key={gender} value={gender}>
            {gender}
          </option>
        ))}
      </SelectField>
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
      <div className="flex flex-col gap-1.5">
        <input type="hidden" name="visitType" value={visitTypes[0]} />
        <p className="text-sm text-muted-foreground">Visit type: {visitTypes[0]}</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }
  return (
    <SelectField label="Visit type" name="visitType" defaultValue={visitTypes[0]} error={error}>
      {visitTypes.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </SelectField>
  );
}

export function ClinicalNoteForm({ visitId, note }: { visitId: string; note: string }) {
  const [state, action, pending] = useActionState(saveNoteAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="visitId" value={visitId} />
      <label htmlFor="clinicalNote" className="text-sm font-medium">
        Clinical note
      </label>
      <textarea
        id="clinicalNote"
        name="clinicalNote"
        defaultValue={note}
        rows={5}
        maxLength={4000}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {state.errors?.clinicalNote ? <p className="text-sm text-destructive">{state.errors.clinicalNote}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <FormMessage message={state.message} ok={state.ok} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </form>
  );
}

export function ChargeForm({ visitId }: { visitId: string }) {
  const [state, action, pending] = useActionState(addChargeAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="visitId" value={visitId} />
      <div className="flex flex-col gap-1.5 sm:col-span-3">
        <label htmlFor="preset" className="text-sm font-medium">
          Common charge
        </label>
        <select
          id="preset"
          defaultValue=""
          className={fieldClass}
          onChange={(event) => {
            const next = CHARGE_PRESETS.find((item) => item.name === event.target.value);
            const form = formRef.current;
            if (!form || !next) return;
            const name = form.elements.namedItem("serviceName");
            const price = form.elements.namedItem("unitPrice");
            if (name instanceof HTMLInputElement) name.value = next.name;
            if (price instanceof HTMLInputElement) price.value = next.price;
          }}
        >
          <option value="">Custom</option>
          {CHARGE_PRESETS.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
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
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="confirm" className="mt-1" required />
        <span>Confirm this visit is ready for discharge. The bed will be freed.</span>
      </label>
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
      <label htmlFor="bedId" className="text-sm font-medium">
        Available bed
      </label>
      <select id="bedId" name="bedId" required className={fieldClass} defaultValue="">
        <option value="" disabled>
          Choose a bed
        </option>
        {beds.map((bed) => (
          <option key={bed.id} value={bed.id}>
            {bed.bedNumber} · {WARD_LABELS[bed.wardType as keyof typeof WARD_LABELS] ?? bed.wardType}
          </option>
        ))}
      </select>
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
      <SelectField label="Ward" name="wardType" defaultValue="GENERAL" error={state.errors?.wardType}>
        {WARD_TYPES.map((ward) => (
          <option key={ward} value={ward}>
            {WARD_LABELS[ward]}
          </option>
        ))}
      </SelectField>
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
      <SelectField label="Category" name="category" defaultValue="Medicine" error={state.errors?.category}>
        {ITEM_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </SelectField>
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
      <label className="sr-only" htmlFor={`qty-${itemId}`}>
        Quantity
      </label>
      <input
        id={`qty-${itemId}`}
        name="quantity"
        inputMode="numeric"
        defaultValue={quantity}
        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-sm"
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
