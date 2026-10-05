import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isSeededAdmin(email: string) {
  const seeded = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(seeded) && seeded === email;
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!user) return null;
  const matches = await verifyPassword(password, user.password);
  if (!matches) return null;
  return user;
}
