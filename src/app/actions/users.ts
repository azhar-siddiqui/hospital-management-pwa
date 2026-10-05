"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import {
  createStaffUser,
  readPermissionSelection,
  setStaffPermissions,
  updateStaffProfile,
  validateStaffInput,
  validateStaffUpdate,
  type FieldErrors,
} from "@/lib/users";

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
  redirect("/staff");
}

export async function updateStaffAction(
  _state: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const actor = await requireUser();
  const userId = String(formData.get("userId") ?? "");
  const parsed = validateStaffUpdate({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
  });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const result = await updateStaffProfile(actor, userId, parsed.data);
  if (!result.ok) {
    return result.errors
      ? { ok: false, errors: result.errors }
      : { ok: false, message: result.message };
  }
  if (result.unchanged) return { ok: true, message: "No changes to save." };
  revalidatePath("/staff");
  revalidatePath(`/staff/${userId}`);
  revalidatePath("/activity");
  redirect("/staff");
}

export async function updateStaffPermissions(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const userId = String(formData.get("userId") ?? "");
  const result = await setStaffPermissions(
    actor,
    userId,
    readPermissionSelection(formData.getAll("permissions")),
  );
  if (!result.ok) return { ok: false, message: result.message };
  if (result.unchanged) return { ok: true, message: "No changes to save." };
  revalidatePath("/staff");
  revalidatePath(`/staff/${userId}`);
  revalidatePath("/activity");
  return { ok: true, message: "Permissions saved." };
}
