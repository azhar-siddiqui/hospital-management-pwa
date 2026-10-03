"use client";

import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field as FieldRoot, FieldError, FieldLabel } from "@/components/ui/field";

export type DoctorChoice = {
  value: string;
  label: string;
  specialty: string | null;
};

function matchesDoctor(item: DoctorChoice, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${item.label} ${item.specialty ?? ""}`.toLowerCase().includes(needle);
}

export function DoctorCombobox({
  doctors,
  error,
}: {
  doctors: DoctorChoice[];
  error?: string;
}) {
  const fieldId = "referringDoctorId";
  const [value, setValue] = useState<DoctorChoice | null>(null);

  useEffect(() => {
    const form = document.getElementById(fieldId)?.closest("form");
    if (!form) return;
    const onReset = () => setValue(null);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <FieldRoot data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={fieldId}>Referring doctor</FieldLabel>
      <Combobox
        items={doctors}
        value={value}
        onValueChange={setValue}
        name="referringDoctorId"
        filter={matchesDoctor}
        autoHighlight
      >
        <ComboboxInput
          id={fieldId}
          placeholder={doctors.length === 0 ? "No doctors yet" : "Search doctors"}
          className="w-full"
          showClear
          disabled={doctors.length === 0}
          aria-invalid={error ? true : undefined}
        />
        <ComboboxContent>
          <ComboboxEmpty>{doctors.length === 0 ? "Add doctors on the Doctors page." : "No matching doctors."}</ComboboxEmpty>
          <ComboboxList>
            {(item: DoctorChoice) => (
              <ComboboxItem key={item.value} value={item}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.label}</span>
                  {item.specialty ? <span className="truncate text-xs text-muted-foreground">{item.specialty}</span> : null}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldRoot>
  );
}
