"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isSeededAdmin } from "@/lib/users";
import type { ActionState } from "@/lib/action-state";

export async function updateStaffPermissions(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const permissions = normalizePermissions(formData.getAll("permissions").map(String));

  if (!userId) {
    return { ok: false, message: "Choose a staff account." };
  }
  if (!permissions) {
    return { ok: false, message: "Choose permissions from the list." };
  }
  if (userId === actor.id) {
    return { ok: false, message: "You can’t change your own permissions." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return { ok: false, message: "That account is no longer on the staff list." };
  }
  if (isSeededAdmin(user.email) || user.role === "ADMIN") {
    return { ok: false, message: "The admin account keeps every permission." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { permissions },
  });
  revalidatePath("/staff");
  revalidatePath(`/staff/${user.id}`);
  redirect("/staff");
}
