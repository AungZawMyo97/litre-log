import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> };

neonConfig.webSocketConstructor = ws;

function createDb() {
  const isTest = process.env.NODE_ENV === "test";
  const connectionString = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      isTest
        ? "TEST_DATABASE_URL is required for database integration tests."
        : "DATABASE_URL environment variable is required.",
    );
  }
  if (isTest && connectionString === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must be different from DATABASE_URL.");
  }
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export * from "./schema";
