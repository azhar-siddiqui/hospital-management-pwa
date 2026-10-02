"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { createStaffUser, validateStaffInput, type FieldErrors } from "@/lib/users";

export type CreateUserState = {
  ok: boolean;
  message?: string;
  errors?: FieldErrors;
};

export async function createUser(
  _state: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = validateStaffInput({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  if (!parsed.ok) {
    return { ok: false, errors: parsed.errors };
  }

  const result = await createStaffUser(parsed.data);
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  revalidatePath("/staff");
  return {
    ok: true,
    message: `${roleLabel(result.user.role)} account created for ${result.user.name}.`,
  };
}
