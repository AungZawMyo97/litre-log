import { and, asc, desc, eq, inArray, type ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import {
  db,
  petrolCycles,
  petrolTransactions,
  vehicles,
  type PetrolCycle,
  type PetrolTransaction,
} from "@/lib/db";
import * as schema from "@/lib/db/schema";

export type DbClient = typeof db;
export type TxClient = PgTransaction<
  NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type CycleWithTransactions = PetrolCycle & { transactions: PetrolTransaction[] };

export async function findOwnedActiveVehicle(
  vehicleId: string,
  userId: string,
  client: DbClient | TxClient = db,
) {
  const [vehicle] = await client
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId), eq(vehicles.isActive, true)))
    .limit(1);

  return vehicle ?? null;
}

export async function lockOwnedActiveVehicle(vehicleId: string, userId: string, tx: TxClient) {
  const [vehicle] = await tx
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId), eq(vehicles.isActive, true)))
    .for("update")
    .limit(1);

  return vehicle ?? null;
}

export async function findCurrentCycle(vehicleId: string, client: DbClient | TxClient = db) {
  const [cycle] = await client
    .select()
    .from(petrolCycles)
    .where(
      and(
        eq(petrolCycles.vehicleId, vehicleId),
        inArray(petrolCycles.status, ["OPEN", "COMPLETED"]),
      ),
    )
    .orderBy(desc(petrolCycles.cycleNumber))
    .limit(1);

  return cycle ?? null;
}

export async function loadCycleTransactions(
  cycleId: string,
  client: DbClient | TxClient = db,
): Promise<PetrolTransaction[]> {
  return client
    .select()
    .from(petrolTransactions)
    .where(eq(petrolTransactions.cycleId, cycleId))
    .orderBy(asc(petrolTransactions.transactionAt));
}

export async function loadCycleWithTransactions(
  cycle: PetrolCycle,
  client: DbClient | TxClient = db,
): Promise<CycleWithTransactions> {
  return { ...cycle, transactions: await loadCycleTransactions(cycle.id, client) };
}

export async function getNextCycleNumber(
  vehicleId: string,
  client: DbClient | TxClient = db,
): Promise<number> {
  const [latest] = await client
    .select({ cycleNumber: petrolCycles.cycleNumber })
    .from(petrolCycles)
    .where(eq(petrolCycles.vehicleId, vehicleId))
    .orderBy(desc(petrolCycles.cycleNumber))
    .limit(1);

  return (latest?.cycleNumber ?? 0) + 1;
}
