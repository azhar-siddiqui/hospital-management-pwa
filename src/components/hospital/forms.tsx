"use client";

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
import { DoctorCombobox, type DoctorChoice } from "@/components/doctors/doctor-combobox";
import { Field, FormMessage, SelectField } from "@/components/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as FieldRoot,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleState } from "@/lib/action-state";
import Link from "next/link";
import {
  GENDERS,
  ITEM_CATEGORIES,
  WARD_LABELS,
  WARD_TYPES,
  type VisitTypeName,
} from "@/lib/validation";
import { IconBed, IconCheck, IconStethoscope, IconUser, IconWalk } from "@tabler/icons-react";
import { useActionState, useEffect, useRef, useState, type ComponentType } from "react";
import { cn } from "cn";

const CHARGE_PRESETS = [
  { name: "ECG", price: "500" },
  { name: "Oxygen (Per Hour)", price: "200" },
  { name: "Blood Test", price: "300" },
];

const VISIT_CHOICES: Record<
  VisitTypeName,
  { title: string; detail: string; icon: ComponentType<{ className?: string }> }
> = {
  OPD: { title: "Outpatient", detail: "Same-day consultation", icon: IconWalk },
  IPD: { title: "Inpatient", detail: "Admit and assign a bed", icon: IconBed },
};

export function RegisterPatientForm({
  visitTypes,
  doctors,
}: {
  visitTypes: VisitTypeName[];
  doctors: DoctorChoice[];
}) {
  const [state, action, pending] = useActionState(registerPatientAction, idleState);
  return (
    <form action={action} className="min-w-0">
      <Card className="w-full">
        <CardContent className="grid gap-0 sm:grid-cols-2">
          <section
            className="flex min-w-0 flex-col gap-4 pb-6 sm:pr-6 sm:pb-0"
            aria-labelledby="patient-section"
          >
            <SectionHeading
              id="patient-section"
              icon={IconUser}
              title="Patient"
              description="Name and phone are required."
            />
            <div className="grid gap-4">
              <Field
                label="Name"
                name="name"
                required
                autoComplete="name"
                placeholder="Full name"
                error={state.errors?.name}
              />
              <Field
                label="Phone"
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="Mobile number"
                error={state.errors?.phone}
              />
              <Field label="Age" name="age" inputMode="numeric" error={state.errors?.age} />
              <SelectField
                label="Gender"
                name="gender"
                placeholder="Not specified"
                error={state.errors?.gender}
                options={GENDERS.map((gender) => ({ value: gender, label: gender }))}
              />
              <Field
                label="Address"
                name="address"
                placeholder="Street, area, city"
                error={state.errors?.address}
              />
            </div>
          </section>

          <section
            className="flex min-w-0 flex-col gap-4 border-t pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
            aria-labelledby="visit-section"
          >
            <SectionHeading
              id="visit-section"
              icon={IconStethoscope}
              title="First visit"
              description="Saved with the patient. One active visit of each type."
            />
            <div className="grid gap-4">
              <RegisterVisitType visitTypes={visitTypes} error={state.errors?.visitType} />
              <DoctorCombobox doctors={doctors} error={state.errors?.referringDoctorId} />
              <DoctorCombobox
                doctors={doctors}
                name="consultationDoctorId"
                label="Consultation doctor"
                error={state.errors?.consultationDoctorId}
              />
              <Field
                label="Consultation fee (INR)"
                name="consultationFee"
                inputMode="decimal"
                defaultValue="0"
                hint="Use 0 if it is not collected now."
                error={state.errors?.consultationFee}
              />
            </div>
          </section>
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
              render={<Link href="/patients" />}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
              {pending ? "Saving…" : "Register patient"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

export function StartVisitForm({
  patientId,
  visitTypes,
  doctors,
}: {
  patientId: string;
  visitTypes: VisitTypeName[];
  doctors: DoctorChoice[];
}) {
  const [state, action, pending] = useActionState(startVisitAction, idleState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="patientId" value={patientId} />
      <DoctorCombobox doctors={doctors} error={state.errors?.referringDoctorId} />
      <DoctorCombobox
        doctors={doctors}
        name="consultationDoctorId"
        label="Consultation doctor"
        error={state.errors?.consultationDoctorId}
      />
      <Field
        label="Consultation fee (INR)"
        name="consultationFee"
        inputMode="decimal"
        defaultValue="0"
        error={state.errors?.consultationFee}
      />
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

function SectionHeading({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 id={id} className="text-sm font-medium">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function RegisterVisitType({ visitTypes, error }: { visitTypes: VisitTypeName[]; error?: string }) {
  const [value, setValue] = useState(visitTypes[0]);

  useEffect(() => {
    const form = document.getElementById("registerVisitType")?.closest("form");
    if (!form) return;
    const onReset = () => setValue(visitTypes[0]);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [visitTypes]);

  return (
    <FieldRoot data-invalid={error ? true : undefined}>
      <input id="registerVisitType" type="hidden" name="visitType" value={value} />
      <p id="visit-type-label" className="text-sm font-medium">
        Visit type
      </p>
      <div
        role="group"
        aria-labelledby="visit-type-label"
        className="grid gap-2"
      >
        {visitTypes.map((type) => {
          const choice = VISIT_CHOICES[type];
          const ChoiceIcon = choice.icon;
          const selected = value === type;
          const single = visitTypes.length === 1;
          const className = cn(
            "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left outline-none",
            selected
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-muted/70",
            !single && "focus-visible:ring-3 focus-visible:ring-ring/50",
          );
          const body = (
            <>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <ChoiceIcon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{choice.title}</span>
                  <Badge variant={selected ? "default" : "secondary"}>{type}</Badge>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {choice.detail}
                </span>
              </span>
              {selected && !single ? (
                <IconCheck className="size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </>
          );
          if (single) {
            return (
              <div key={type} className={className}>
                {body}
              </div>
            );
          }
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              onClick={() => setValue(type)}
              className={className}
            >
              {body}
            </button>
          );
        })}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldRoot>
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
          <SelectContent alignItemWithTrigger={false}>
            {PRESET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRoot>
      <Field label="Service" name="serviceName" required error={state.errors?.serviceName} />
      <Field
        label="Quantity"
        name="quantity"
        required
        inputMode="numeric"
        defaultValue="1"
        error={state.errors?.quantity}
      />
      <Field
        label="Unit price (INR)"
        name="unitPrice"
        required
        inputMode="decimal"
        error={state.errors?.unitPrice}
      />
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
        options={WARD_TYPES.map((ward) => ({
          value: ward,
          label: WARD_LABELS[ward],
        }))}
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

export function BedStatusForm({
  bedId,
  status,
}: {
  bedId: string;
  status: "AVAILABLE" | "MAINTENANCE";
}) {
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
        options={ITEM_CATEGORIES.map((category) => ({
          value: category,
          label: category,
        }))}
      />
      <Field label="Unit" name="unit" required placeholder="Pieces" error={state.errors?.unit} />
      <Field
        label="Quantity"
        name="quantity"
        required
        inputMode="numeric"
        defaultValue="0"
        error={state.errors?.quantity}
      />
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
      <Field
        label="Amount (INR)"
        name="amount"
        required
        inputMode="decimal"
        error={state.errors?.amount}
      />
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
