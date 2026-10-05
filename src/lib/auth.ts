import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { can, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user, permission)) {
    redirect("/");
  }
  return user;
}

export async function requireAdmin() {
  return requirePermission("staff:manage");
}
