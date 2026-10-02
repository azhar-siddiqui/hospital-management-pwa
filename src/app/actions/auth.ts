"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/lib/permissions";
import { authenticate } from "@/lib/users";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export type LoginState = {
  message?: string;
};

function safeNextPath(value: FormDataEntryValue | null) {
  return safeReturnPath(typeof value === "string" ? value : null);
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(formData.get("next"));

  if (!email.trim() || !password) {
    return { message: "Enter your email and password." };
  }

  const user = await authenticate(email, password);
  if (!user) {
    return { message: "Email or password is incorrect." };
  }

  const token = await createSessionToken(user.id, user.role);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions);
  redirect(nextPath);
}

export async function logout() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  redirect("/login");
}
