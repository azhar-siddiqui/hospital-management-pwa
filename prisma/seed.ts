import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import { roleGrants } from "../src/lib/permissions";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding the admin.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await hashPassword(password);
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password: passwordHash,
        role: Role.ADMIN,
        permissions: roleGrants("ADMIN"),
      },
      create: {
        name,
        email,
        password: passwordHash,
        role: Role.ADMIN,
        permissions: roleGrants("ADMIN"),
      },
      select: { id: true, email: true, role: true },
    });

    console.log(`Admin account ready: ${admin.email} (${admin.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
