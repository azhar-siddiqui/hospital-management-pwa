"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft, IconEye, IconEyeOff } from "@tabler/icons-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { createStaff } from "@/app/actions/staff";
import { StaffPermissionMatrix } from "@/components/tables/staff-permission-matrix";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { idleState } from "@/lib/action-state";
import type { Permission } from "@/lib/permissions";
import { STAFF_ROLES, roleLabel } from "@/lib/roles";
import { staffAccountSchema, type StaffAccountValues } from "@/lib/staff-schema";
import { useRouter } from "next/navigation";

const roleOptions = STAFF_ROLES.map((role) => ({ value: role, label: roleLabel(role) }));
const scrollClearance = "scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0";

export function AddStaffForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [selected, setSelected] = useState<Permission[]>([]);
  const [subject, setSubject] = useState("this account");
  const [state, submit, pending] = useActionState(createStaff, idleState);
  const form = useForm<StaffAccountValues>({
    resolver: zodResolver(staffAccountSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "RECEPTIONIST",
    },
  });

  function onSubmit(values: StaffAccountValues) {
    if (pending) return;
    const body = new FormData();
    body.set("name", values.name);
    body.set("email", values.email);
    body.set("password", values.password);
    body.set("role", values.role);
    for (const permission of selected) body.append("permissions", permission);
    startTransition(() => submit(body));
  }

  return (
    <form
      id="add-staff-form"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full min-w-0 flex-col gap-6"
    >
      <section className="min-w-0 rounded-xl bg-card px-4 py-4 text-card-foreground ring-1 ring-foreground/10 sm:px-5">
        <h2 className="text-sm font-medium">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name, username, password, and role for the new account.
        </p>
        <FieldGroup className="mt-4 grid gap-4 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="add-staff-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="add-staff-name"
                  autoComplete="name"
                  disabled={pending}
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => {
                    field.onChange(event);
                    setSubject(event.target.value.trim() || "this account");
                  }}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="add-staff-username">Username</FieldLabel>
                <Input
                  {...field}
                  id="add-staff-username"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="username"
                  disabled={pending}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>They sign in with this username.</FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="add-staff-password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="add-staff-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={pending}
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-sm"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      aria-controls="add-staff-password"
                      disabled={pending}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>At least 8 characters.</FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="add-staff-role">Role</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "RECEPTIONIST")}
                  items={roleOptions}
                  disabled={pending}
                >
                  <SelectTrigger
                    id="add-staff-role"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </section>
      <StaffPermissionMatrix
        subject={subject}
        selected={selected}
        onSelectedChange={setSelected}
        pending={pending}
      />
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" className={scrollClearance} onClick={() => router.back()}>
          <IconArrowLeft data-icon="inline-start" /> Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className={scrollClearance}
            nativeButton={false}
            render={<Link href="/staff" />}
          >
            Cancel
          </Button>
          <Button type="submit" className={scrollClearance} disabled={pending}>
            {pending && <Spinner aria-hidden />}
            Add staff
          </Button>
        </div>
      </div>
    </form>
  );
}
