"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft, IconEye, IconEyeOff } from "@tabler/icons-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { updateStaff } from "@/app/actions/staff";
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
import { STAFF_ROLES, roleLabel, type StaffRole } from "@/lib/roles";
import { staffAccountUpdateSchema, type StaffAccountUpdateValues } from "@/lib/staff-schema";

const roleOptions = STAFF_ROLES.map((role) => ({ value: role, label: roleLabel(role) }));
const scrollClearance = "scroll-mb-[calc(5.25rem+env(safe-area-inset-bottom))] md:scroll-mb-0";

export function StaffEditForm({
  userId,
  name,
  email,
  role,
  assigned,
}: {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  assigned: readonly Permission[];
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [selected, setSelected] = useState<Permission[]>([...assigned]);
  const [subject, setSubject] = useState(name);
  const [state, submit, pending] = useActionState(updateStaff, idleState);
  const form = useForm<StaffAccountUpdateValues>({
    resolver: zodResolver(staffAccountUpdateSchema),
    defaultValues: {
      name,
      email,
      password: "",
      role,
    },
  });

  function onSubmit(values: StaffAccountUpdateValues) {
    if (pending) return;
    const body = new FormData();
    body.set("userId", userId);
    body.set("name", values.name);
    body.set("email", values.email);
    body.set("password", values.password);
    body.set("role", values.role);
    for (const permission of selected) body.append("permissions", permission);
    startTransition(() => submit(body));
  }

  return (
    <form
      id="edit-staff-form"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full min-w-0 flex-col gap-6"
    >
      <section className="min-w-0 rounded-xl bg-card px-4 py-4 text-card-foreground ring-1 ring-foreground/10 sm:px-5">
        <h2 className="text-sm font-medium">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name, username, password, and role for this account.
        </p>
        <FieldGroup className="mt-4 grid gap-4 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-staff-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="edit-staff-name"
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
                <FieldLabel htmlFor="edit-staff-username">Username</FieldLabel>
                <Input
                  {...field}
                  id="edit-staff-username"
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
                <FieldLabel htmlFor="edit-staff-password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="edit-staff-password"
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
                      aria-controls="edit-staff-password"
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
                  <FieldDescription>Leave blank to keep the current password.</FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-staff-role">Role</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? role)}
                  items={roleOptions}
                  disabled={pending}
                >
                  <SelectTrigger
                    id="edit-staff-role"
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
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          className={scrollClearance}
          nativeButton={false}
          render={<Link href="/staff" />}
        >
          <IconArrowLeft data-icon="inline-start" />
          Back
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
            {pending ? <Spinner aria-hidden /> : null}
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
