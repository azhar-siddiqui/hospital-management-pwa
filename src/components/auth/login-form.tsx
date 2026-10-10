"use client";

import { login, type LoginState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema, type LoginValues } from "@/lib/login-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconAlertCircle,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
} from "@tabler/icons-react";
import { startTransition, useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { Controller, useForm } from "react-hook-form";

const REMEMBERED_EMAIL_KEY = "hms.login.email";
const initialState: LoginState = {};

function subscribeRememberedEmail(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readRememberedEmail() {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, submitLogin, pending] = useActionState(login, initialState);
  const [seenState, setSeenState] = useState(state);
  const [hideNotice, setHideNotice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const rememberedEmail = useSyncExternalStore(
    subscribeRememberedEmail,
    readRememberedEmail,
    () => "",
  );
  const [rememberOverride, setRememberOverride] = useState<boolean | null>(null);
  const remember = rememberOverride ?? rememberedEmail.length > 0;

  if (seenState !== state) {
    setSeenState(state);
    setHideNotice(false);
  }

  const notice = hideNotice ? undefined : state.message;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!rememberedEmail || form.getValues("email")) return;
    form.setValue("email", rememberedEmail);
  }, [form, rememberedEmail]);

  function onSubmit(values: LoginValues) {
    if (pending) return;
    if (remember) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
    setHideNotice(true);
    const body = new FormData();
    body.set("email", values.email);
    body.set("password", values.password);
    if (nextPath) body.set("next", nextPath);
    startTransition(() => {
      submitLogin(body);
    });
  }

  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          Use the staff email and password an administrator created for you.
        </p>
      </header>
      <form id="login-form" noValidate onSubmit={form.handleSubmit(onSubmit)} aria-busy={pending}>
        <FieldGroup className="gap-5">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">Username</FieldLabel>
                <InputGroup className="h-11">
                  <InputGroupAddon>
                    <IconMail />
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="username"
                    spellCheck={false}
                    placeholder="name@hospital.org"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? "login-email-error" : undefined}
                    disabled={pending}
                    className="h-11"
                    onChange={(event) => {
                      field.onChange(event);
                      setHideNotice(true);
                    }}
                  />
                </InputGroup>
                {fieldState.invalid ? (
                  <FieldError id="login-email-error" errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <InputGroup className="h-11">
                  <InputGroupAddon>
                    <IconLock />
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? "login-password-error" : undefined}
                    disabled={pending}
                    className="h-11"
                    onChange={(event) => {
                      field.onChange(event);
                      setHideNotice(true);
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-sm"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      aria-controls="login-password"
                      disabled={pending}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid ? (
                  <FieldError id="login-password-error" errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Field orientation="horizontal">
            <Checkbox
              id="login-remember"
              checked={remember}
              onCheckedChange={(checked) => setRememberOverride(checked === true)}
              disabled={pending}
            />
            <FieldContent>
              <FieldLabel htmlFor="login-remember" className="font-normal">
                Remember me
              </FieldLabel>
              <FieldDescription>Saves your email on this device.</FieldDescription>
            </FieldContent>
          </Field>
          {notice ? (
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
            {pending ? (
              <>
                <Spinner aria-hidden />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <IconArrowRight data-icon="inline-end" />
              </>
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
