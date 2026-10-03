"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/field";

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <Field
        label="Email"
        name="email"
        type="text"
        inputMode="email"
        autoComplete="username"
        spellCheck={false}
        required
      />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormMessage message={state.message} />
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
