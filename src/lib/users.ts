import { Prisma } from "@/generated/prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { isStaffRole, type StaffRole } from "@/lib/roles";

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

export function isSeededAdmin(email: string) {
  const seeded = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(seeded) && seeded === email;
}
