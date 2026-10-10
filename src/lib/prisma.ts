import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// A new key drops a client cached before `passwordSeal` existed. Hot reload keeps the old object under `prisma`.
const globalForPrisma = globalThis as unknown as { hmsPrisma?: PrismaClient };

export const prisma = globalForPrisma.hmsPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.hmsPrisma = prisma;
}
