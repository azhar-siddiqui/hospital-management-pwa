import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // A second Neon connection pays another TLS handshake, about 2.5s.
  // One connection keeps the staff list and count on the socket already open.
  const pool = new Pool({ connectionString, max: 1 });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// A new key drops a client cached with the old pool. Hot reload keeps the old object.
const globalForPrisma = globalThis as unknown as { hmsPrismaPool?: PrismaClient };

export const prisma = globalForPrisma.hmsPrismaPool ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.hmsPrismaPool = prisma;
}
