"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { staffAccountSchema, staffAccountUpdateSchema } from "@/lib/staff-schema";
import { isSeededAdmin, normalizeEmail } from "@/lib/users";
import { Prisma } from "@/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";

export async function createStaff(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = staffAccountSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const permissions = normalizePermissions(formData.getAll("permissions").map(String));
  if (!permissions) {
    return { ok: false, message: "Choose permissions from the list." };
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: normalizeEmail(parsed.data.email),
        password: await hashPassword(parsed.data.password),
        role: parsed.data.role,
        permissions,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "That username is already in use." };
    }
    throw error;
  }

  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaff(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const parsed = staffAccountUpdateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    role: formData.get("role"),
  });
  const permissions = normalizePermissions(formData.getAll("permissions").map(String));

  if (!userId) {
    return { ok: false, message: "Choose a staff account." };
  }
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  if (!permissions) {
    return { ok: false, message: "Choose permissions from the list." };
  }
  if (userId === actor.id) {
    return { ok: false, message: "You can’t change your own account." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return { ok: false, message: "That account is no longer on the staff list." };
  }
  if (isSeededAdmin(user.email) || user.role === "ADMIN") {
    return { ok: false, message: "The admin account can’t be changed." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        email: normalizeEmail(parsed.data.email),
        role: parsed.data.role,
        permissions,
        ...(parsed.data.password ? { password: await hashPassword(parsed.data.password) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "That username is already in use." };
    }
    throw error;
  }

  revalidatePath("/staff");
  revalidatePath(`/staff/${user.id}`);
  redirect("/staff");
}
