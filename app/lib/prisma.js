import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis;

function makePrisma() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,              // 1 connection per serverless instance
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();
globalForPrisma.prisma = prisma;