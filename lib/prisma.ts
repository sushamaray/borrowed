import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

function hasBillingOrderDelegate(client: PrismaClient) {
  return "billingOrder" in client;
}

function createPrismaClient() {
  return new PrismaClient();
}

const existingPrisma = globalForPrisma.prisma;

if (existingPrisma && !hasBillingOrderDelegate(existingPrisma)) {
  void existingPrisma.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma;
