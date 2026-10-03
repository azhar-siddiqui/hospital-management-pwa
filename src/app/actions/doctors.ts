"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { createDoctor, parseDoctor } from "@/lib/doctors";

export async function createDoctorAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const parsed = parseDoctor(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await createDoctor(actor.role, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/doctors");
  revalidatePath("/patients");
  revalidatePath("/patients/[id]", "page");
  return { ok: true, message: "Doctor added." };
}
