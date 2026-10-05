import { Prisma } from "@/generated/prisma/client";
import { fieldChanges, showValue, writeAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { PERMISSIONS, permissionLabel, roleGrants, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isStaffRole, roleLabel, type StaffRole } from "@/lib/roles";
import { isUuid } from "@/lib/validation";

export type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!user) {
    return null;
  }

  const matches = await verifyPassword(password, user.password);
  if (!matches) {
    return null;
  }

  return user;
}

export function validateStaffInput(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const role = input.role;

  if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!isStaffRole(role)) {
    errors.role = "Choose receptionist, doctor, nurse, or assistant.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: { name, email, password, role: role as StaffRole },
  };
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}) {
  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: await hashPassword(input.password),
        role: input.role,
        permissions: roleGrants(input.role),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return { ok: true as const, user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false as const,
        errors: { email: "An account with this email already exists." } satisfies FieldErrors,
      };
    }
    throw error;
  }
}

export function readPermissionSelection(values: FormDataEntryValue[]) {
  const allowed = new Set<string>(PERMISSIONS);
  const selected = new Set<Permission>();
  for (const value of values) {
    if (typeof value === "string" && allowed.has(value)) selected.add(value as Permission);
  }
  return [...selected];
}

export function validateStaffUpdate(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const role = input.role;

  if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password && password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!isStaffRole(role)) {
    errors.role = "Choose receptionist, doctor, nurse, or assistant.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: { name, email, password, role: role as StaffRole },
  };
}

export async function updateStaffProfile(
  actor: { id: string; name: string; role: string },
  userId: string,
  input: { name: string; email: string; password: string; role: StaffRole },
) {
  if (actor.role !== "ADMIN") {
    return { ok: false as const, message: "Only an admin can edit staff." };
  }
  if (!isUuid(userId)) return { ok: false as const, message: "Staff member not found." };
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!target) return { ok: false as const, message: "Staff member not found." };
  if (target.role === "ADMIN") {
    return { ok: false as const, message: "The admin account cannot be edited." };
  }

  const changes = fieldChanges([
    { field: "name", label: "Name", before: showValue(target.name), after: showValue(input.name) },
    {
      field: "email",
      label: "Email",
      before: showValue(target.email),
      after: showValue(input.email),
    },
    {
      field: "role",
      label: "Role",
      before: roleLabel(target.role),
      after: roleLabel(input.role),
    },
  ]);
  if (input.password) {
    changes.push({ field: "password", label: "Password", from: "Set", to: "Replaced" });
  }
  if (changes.length === 0) return { ok: true as const, unchanged: true as const };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          ...(input.password ? { password: await hashPassword(input.password) } : {}),
        },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        actorName: actor.name,
        subjectType: "staff",
        subjectId: target.id,
        subjectName: input.name,
        summary: `Updated staff ${input.name}`,
        changes,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false as const,
        errors: { email: "An account with this email already exists." } satisfies FieldErrors,
      };
    }
    throw error;
  }

  return { ok: true as const, unchanged: false as const };
}

export async function setStaffPermissions(
  actor: { id: string; name: string; role: string },
  userId: string,
  permissions: Permission[],
) {
  if (actor.role !== "ADMIN") {
    return { ok: false as const, message: "Only an admin can change permissions." };
  }
  if (!isUuid(userId)) return { ok: false as const, message: "Staff member not found." };
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, permissions: true },
  });
  if (!target) return { ok: false as const, message: "Staff member not found." };
  if (target.role === "ADMIN") {
    return { ok: false as const, message: "The admin account keeps every permission." };
  }

  const before = new Set(target.permissions);
  const after = new Set(permissions);
  const added = PERMISSIONS.filter(
    (permission) => after.has(permission) && !before.has(permission),
  );
  const removed = PERMISSIONS.filter(
    (permission) => before.has(permission) && !after.has(permission),
  );
  if (added.length === 0 && removed.length === 0) {
    return { ok: true as const, unchanged: true as const };
  }

  const changes = [
    ...(added.length > 0
      ? [
          {
            field: "permissionsAdded",
            label: "Permissions added",
            from: "—",
            to: added.map(permissionLabel).join(", "),
          },
        ]
      : []),
    ...(removed.length > 0
      ? [
          {
            field: "permissionsRemoved",
            label: "Permissions removed",
            from: removed.map(permissionLabel).join(", "),
            to: "—",
          },
        ]
      : []),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: { permissions } });
    await writeAudit(tx, {
      actorId: actor.id,
      actorName: actor.name,
      subjectType: "staff",
      subjectId: target.id,
      subjectName: target.name,
      summary: `Updated permissions for ${target.name}`,
      changes,
    });
  });
  return { ok: true as const, unchanged: false as const };
}

export function isSeededAdmin(email: string) {
  const seeded = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(seeded) && seeded === email;
}
