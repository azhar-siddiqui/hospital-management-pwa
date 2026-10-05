"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { createDoctor, parseDoctor, updateDoctor } from "@/lib/doctors";
import { isUuid, readText } from "@/lib/validation";

export async function createDoctorAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const parsed = parseDoctor(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await createDoctor(actor, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/doctors");
  revalidatePath("/patients");
  revalidatePath("/patients/[id]", "page");
  redirect("/doctors");
}

export async function updateDoctorAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const doctorId = readText(formData.get("doctorId"));
  if (!isUuid(doctorId)) return { ok: false, message: "Doctor not found." };
  const parsed = parseDoctor(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await updateDoctor(actor, doctorId, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };
  if (result.unchanged) return { ok: true, message: "No changes to save." };
  revalidatePath("/doctors");
  revalidatePath("/activity");
  revalidatePath("/patients/[id]", "page");
  redirect("/doctors");
}
