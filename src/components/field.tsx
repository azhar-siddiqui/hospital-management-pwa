"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useEffect, useState, type ComponentProps } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
} & ComponentProps<typeof Input>) {
  const id = props.id ?? name;
  return (
    <FieldRoot className={className} data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} name={name} aria-invalid={error ? true : undefined} {...props} />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </FieldRoot>
  );
}

export function SelectField({
  label,
  name,
  error,
  options,
  defaultValue,
  id,
  required,
  disabled,
  placeholder,
}: {
  label: string;
  name: string;
  error?: string;
  options: SelectOption[];
  defaultValue?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const fieldId = id ?? name;
  const initial = defaultValue ? defaultValue : null;
  const [value, setValue] = useState<string | null>(initial);

  useEffect(() => {
    const form = document.getElementById(fieldId)?.closest("form");
    if (!form) return;
    const onReset = () => setValue(initial);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [fieldId, initial]);

  return (
    <FieldRoot data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Select
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        onValueChange={setValue}
        items={options}
      >
        <SelectTrigger
          id={fieldId}
          className="w-full min-w-0"
          aria-invalid={error ? true : undefined}
        >
          <SelectValue className="min-w-0" placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldRoot>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <Alert variant={ok ? "default" : "destructive"} role={ok ? "status" : "alert"}>
      <AlertDescription className={ok ? "text-foreground" : undefined}>{message}</AlertDescription>
    </Alert>
  );
}
