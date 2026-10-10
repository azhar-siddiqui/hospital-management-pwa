"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/login-schema";
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
  const email = formData.get("email");
  const password = formData.get("password");
  const parsed = loginSchema.safeParse({
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Enter your username and password." };
  }

  const nextPath = safeNextPath(formData.get("next"));
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return { message: "Username or password is incorrect." };
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
