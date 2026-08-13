import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> };

neonConfig.webSocketConstructor = ws;

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required.");
  }
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export * from "./schema";
