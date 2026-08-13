import { my } from "@/lib/i18n/my";
import { and, asc, desc, eq, inArray, type ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import {
  db,
  petrolCycles,
  petrolTransactions,
  type PetrolCycle,
  type PetrolTransaction,
} from "@/lib/db";
import { getNumericSetting, getAppTimezone } from "@/lib/settings";
import {
  computeCycleState,
  validateTransactionLitres,
  canRecordTransaction,
  type CycleComputation,
} from "@/lib/services/petrol-cycle-logic";
import { startOfAppDay } from "@/lib/timezone";
import { vehicles } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";

type DbClient = typeof db;
type TxClient = PgTransaction<NeonQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export class PetrolCycleError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "PetrolCycleError";
  }
}

type CycleWithTransactions = PetrolCycle & { transactions: PetrolTransaction[] };

async function getVehicleForUser(vehicleId: string, userId: string) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId), eq(vehicles.isActive, true)))
    .limit(1);

  if (!vehicle) {
    throw new PetrolCycleError(my.errors.vehicleNotFound, 404);
  }
  return vehicle;
}

async function getAllocationAndInterval() {
  const [allowedLitres, cycleIntervalDays, timezone] = await Promise.all([
    getNumericSetting("petrol_allocation_litres"),
    getNumericSetting("petrol_cycle_interval_days"),
    getAppTimezone(),
  ]);
  return { allowedLitres, cycleIntervalDays, timezone };
}

function mapTransactions(transactions: PetrolTransaction[]) {
  return transactions.map((tx) => ({
    litres: tx.litres,
    transactionAt: tx.transactionAt,
  }));
}

async function loadCycleTransactions(
  cycleId: string,
  client: DbClient | TxClient = db,
): Promise<PetrolTransaction[]> {
  return client
    .select()
    .from(petrolTransactions)
    .where(eq(petrolTransactions.cycleId, cycleId))
    .orderBy(asc(petrolTransactions.transactionAt));
}

async function loadCycleWithTransactions(
  cycle: PetrolCycle,
  client: DbClient | TxClient = db,
): Promise<CycleWithTransactions> {
  const transactions = await loadCycleTransactions(cycle.id, client);
  return { ...cycle, transactions };
}

async function getNextCycleNumber(vehicleId: string, client: DbClient | TxClient = db): Promise<number> {
  const [latest] = await client
    .select({ cycleNumber: petrolCycles.cycleNumber })
    .from(petrolCycles)
    .where(eq(petrolCycles.vehicleId, vehicleId))
    .orderBy(desc(petrolCycles.cycleNumber))
    .limit(1);

  return (latest?.cycleNumber ?? 0) + 1;
}

export async function getCurrentCycle(vehicleId: string, userId: string) {
  await getVehicleForUser(vehicleId, userId);

  const [cycle] = await db
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

  if (!cycle) return null;
  return loadCycleWithTransactions(cycle);
}

export async function getCycleComputation(cycle: CycleWithTransactions): Promise<CycleComputation> {
  const { cycleIntervalDays, timezone } = await getAllocationAndInterval();
  return computeCycleState(
    cycle.allowedLitres,
    mapTransactions(cycle.transactions),
    cycleIntervalDays,
    timezone,
  );
}

export type RecordPetrolInput = {
  vehicleId: string;
  userId: string;
  litres: number;
  transactionAt: Date;
  station?: string;
  receiptRef?: string;
  notes?: string;
};

export async function recordPetrolTransaction(input: RecordPetrolInput) {
  const { allowedLitres, cycleIntervalDays, timezone } = await getAllocationAndInterval();

  return db.transaction(async (tx) => {
    await getVehicleForUser(input.vehicleId, input.userId);

    const [existingCycle] = await tx
      .select()
      .from(petrolCycles)
      .where(
        and(
          eq(petrolCycles.vehicleId, input.vehicleId),
          inArray(petrolCycles.status, ["OPEN", "COMPLETED"]),
        ),
      )
      .orderBy(desc(petrolCycles.cycleNumber))
      .limit(1);

    let cycle: CycleWithTransactions;

    if (!existingCycle) {
      const [created] = await tx
        .insert(petrolCycles)
        .values({
          vehicleId: input.vehicleId,
          cycleNumber: 1,
          allowedLitres,
          status: "OPEN",
        })
        .returning();
      cycle = { ...created, transactions: [] };
    } else {
      cycle = await loadCycleWithTransactions(existingCycle, tx);
    }

    let computation = computeCycleState(
      cycle.allowedLitres,
      mapTransactions(cycle.transactions),
      cycleIntervalDays,
      timezone,
    );

    if (
      computation.status === "COMPLETED" &&
      computation.nextEligibleAt &&
      startOfAppDay(input.transactionAt, timezone).getTime() >=
        computation.nextEligibleAt.getTime()
    ) {
      await tx
        .update(petrolCycles)
        .set({ status: "COMPLETED", version: cycle.version + 1, updatedAt: new Date() })
        .where(and(eq(petrolCycles.id, cycle.id), eq(petrolCycles.version, cycle.version)));

      const nextNumber = await getNextCycleNumber(input.vehicleId, tx);

      const [created] = await tx
        .insert(petrolCycles)
        .values({
          vehicleId: input.vehicleId,
          cycleNumber: nextNumber,
          allowedLitres,
          status: "OPEN",
        })
        .returning();

      cycle = { ...created, transactions: [] };
      computation = computeCycleState(cycle.allowedLitres, [], cycleIntervalDays, timezone);
    }

    if (!canRecordTransaction(computation, input.transactionAt, timezone)) {
      throw new PetrolCycleError(my.errors.notEligiblePetrol);
    }

    const validation = validateTransactionLitres(input.litres, computation.remainingLitres);
    if (!validation.valid) {
      throw new PetrolCycleError(validation.message);
    }

    const [lockedCycle] = await tx
      .select()
      .from(petrolCycles)
      .where(eq(petrolCycles.id, cycle.id))
      .limit(1);

    if (!lockedCycle) {
      throw new PetrolCycleError(my.errors.cycleNotFound, 404);
    }

    await tx.insert(petrolTransactions).values({
      cycleId: lockedCycle.id,
      litres: input.litres,
      transactionAt: input.transactionAt,
      station: input.station,
      receiptRef: input.receiptRef,
      notes: input.notes,
    });

    const updatedTransactions = await tx
      .select()
      .from(petrolTransactions)
      .where(eq(petrolTransactions.cycleId, lockedCycle.id))
      .orderBy(asc(petrolTransactions.transactionAt));

    const updatedComputation = computeCycleState(
      lockedCycle.allowedLitres,
      mapTransactions(updatedTransactions),
      cycleIntervalDays,
      timezone,
    );

    if (updatedComputation.status === "COMPLETED") {
      await tx
        .update(petrolCycles)
        .set({
          status: "COMPLETED",
          completedAt: updatedComputation.completedAt,
          nextEligibleAt: updatedComputation.nextEligibleAt,
          version: lockedCycle.version + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(petrolCycles.id, lockedCycle.id), eq(petrolCycles.version, lockedCycle.version)));
    } else {
      await tx
        .update(petrolCycles)
        .set({ version: lockedCycle.version + 1, updatedAt: new Date() })
        .where(and(eq(petrolCycles.id, lockedCycle.id), eq(petrolCycles.version, lockedCycle.version)));
    }

    const [result] = await tx
      .select()
      .from(petrolCycles)
      .where(eq(petrolCycles.id, lockedCycle.id))
      .limit(1);

    return loadCycleWithTransactions(result, tx);
  });
}

export async function getPetrolHistory(vehicleId: string, userId: string) {
  await getVehicleForUser(vehicleId, userId);

  const cycles = await db
    .select()
    .from(petrolCycles)
    .where(eq(petrolCycles.vehicleId, vehicleId))
    .orderBy(desc(petrolCycles.cycleNumber));

  const { cycleIntervalDays, timezone } = await getAllocationAndInterval();

  return Promise.all(
    cycles.map(async (cycle) => {
      const withTx = await loadCycleWithTransactions(cycle);
      return {
        cycle: withTx,
        computation: computeCycleState(
          withTx.allowedLitres,
          mapTransactions(withTx.transactions),
          cycleIntervalDays,
          timezone,
        ),
      };
    }),
  );
}

export async function getVehiclePetrolSummary(vehicleId: string, userId: string) {
  const cycle = await getCurrentCycle(vehicleId, userId);
  const { allowedLitres, timezone } = await getAllocationAndInterval();

  if (!cycle) {
    return {
      allowedLitres,
      totalTaken: 0,
      remainingLitres: allowedLitres,
      status: "OPEN" as const,
      completedAt: null,
      nextEligibleAt: null,
      cycleNumber: null,
      canTakePetrol: true,
    };
  }

  const computation = await getCycleComputation(cycle);
  const now = new Date();

  return {
    allowedLitres: cycle.allowedLitres,
    totalTaken: computation.totalTaken,
    remainingLitres: computation.remainingLitres,
    status: computation.status,
    completedAt: computation.completedAt,
    nextEligibleAt: computation.nextEligibleAt,
    cycleNumber: cycle.cycleNumber,
    canTakePetrol: canRecordTransaction(computation, now, timezone),
  };
}
