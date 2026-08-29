import { and, desc, eq } from "drizzle-orm";
import { db, petrolCycles, petrolTransactions, type PetrolTransaction } from "@/lib/db";
import { my } from "@/lib/i18n/my";
import { getAppTimezone, getNumericSetting } from "@/lib/settings";
import {
  canRecordTransaction,
  computeCycleState,
  isEligibleForNewCycle,
  type CycleComputation,
  validateTransactionLitres,
} from "@/lib/services/petrol-cycle-logic";
import {
  findCurrentCycle,
  findOwnedActiveVehicle,
  getNextCycleNumber,
  loadCycleTransactions,
  loadCycleWithTransactions,
  lockOwnedActiveVehicle,
  type CycleWithTransactions,
} from "@/lib/services/petrol-cycle-repository";
import type { VehiclePetrolSummary } from "@/lib/services/petrol-summary";
import {
  getNextDrivingAllowedDay,
  isDrivingAllowedForParity,
} from "@/lib/services/vehicle-restriction-service";
import { isFutureAppDay, startOfAppDay } from "@/lib/timezone";

export class PetrolCycleError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "PETROL_CYCLE_ERROR",
  ) {
    super(message);
    this.name = "PetrolCycleError";
  }
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
  return transactions.map((transaction) => ({
    litres: transaction.litres,
    transactionAt: transaction.transactionAt,
  }));
}

function assertTransactionDate(
  transactionAt: Date,
  asOf: Date,
  timezone: string,
  cycleStartedAt?: Date | null,
) {
  if (!Number.isFinite(transactionAt.getTime())) {
    throw new PetrolCycleError(my.errors.invalidRefillDate, 400, "INVALID_REFILL_DATE");
  }
  if (isFutureAppDay(transactionAt, asOf, timezone)) {
    throw new PetrolCycleError(my.errors.futureRefillDate, 422, "FUTURE_REFILL_DATE");
  }
  if (
    cycleStartedAt &&
    startOfAppDay(transactionAt, timezone).getTime() <
      startOfAppDay(cycleStartedAt, timezone).getTime()
  ) {
    throw new PetrolCycleError(my.errors.refillBeforeCycle, 422, "REFILL_BEFORE_CYCLE");
  }
}

export async function getCurrentCycle(vehicleId: string, userId: string) {
  const vehicle = await findOwnedActiveVehicle(vehicleId, userId);
  if (!vehicle) {
    throw new PetrolCycleError(my.errors.vehicleNotFound, 404, "VEHICLE_NOT_FOUND");
  }
  const cycle = await findCurrentCycle(vehicleId);
  return cycle ? loadCycleWithTransactions(cycle) : null;
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
  const asOf = new Date();
  assertTransactionDate(input.transactionAt, asOf, timezone);

  return db.transaction(async (tx) => {
    const vehicle = await lockOwnedActiveVehicle(input.vehicleId, input.userId, tx);
    if (!vehicle) {
      throw new PetrolCycleError(my.errors.vehicleNotFound, 404, "VEHICLE_NOT_FOUND");
    }
    if (!isDrivingAllowedForParity(vehicle.plateParity, input.transactionAt, timezone)) {
      throw new PetrolCycleError(my.errors.drivingRestrictedRefill, 422, "DRIVING_RESTRICTED");
    }

    const existingCycle = await findCurrentCycle(input.vehicleId, tx);
    let cycle: CycleWithTransactions;
    if (!existingCycle) {
      const [created] = await tx
        .insert(petrolCycles)
        .values({
          vehicleId: input.vehicleId,
          cycleNumber: await getNextCycleNumber(input.vehicleId, tx),
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
    assertTransactionDate(input.transactionAt, asOf, timezone, computation.cycleStartedAt);

    if (isEligibleForNewCycle(computation, input.transactionAt, timezone)) {
      const [closed] = await tx
        .update(petrolCycles)
        .set({
          status: computation.status === "COMPLETED" ? "COMPLETED" : "SUPERSEDED",
          completedAt: computation.completedAt,
          nextEligibleAt: computation.nextEligibleAt,
          version: cycle.version + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(petrolCycles.id, cycle.id), eq(petrolCycles.version, cycle.version)))
        .returning({ id: petrolCycles.id });
      if (!closed) {
        throw new PetrolCycleError(my.errors.concurrentUpdate, 409, "CONCURRENT_UPDATE");
      }

      const [created] = await tx
        .insert(petrolCycles)
        .values({
          vehicleId: input.vehicleId,
          cycleNumber: await getNextCycleNumber(input.vehicleId, tx),
          allowedLitres,
          status: "OPEN",
        })
        .returning();
      cycle = { ...created, transactions: [] };
      computation = computeCycleState(cycle.allowedLitres, [], cycleIntervalDays, timezone);
    }

    if (!canRecordTransaction(computation, input.transactionAt, timezone)) {
      throw new PetrolCycleError(my.errors.notEligiblePetrol, 422, "NOT_ELIGIBLE");
    }
    const validation = validateTransactionLitres(input.litres, computation.remainingLitres);
    if (!validation.valid) {
      throw new PetrolCycleError(validation.message, 422, "INVALID_LITRES");
    }

    await tx.insert(petrolTransactions).values({
      cycleId: cycle.id,
      litres: input.litres,
      transactionAt: input.transactionAt,
      station: input.station?.trim() || null,
      receiptRef: input.receiptRef?.trim() || null,
      notes: input.notes?.trim() || null,
    });

    const updatedTransactions = await loadCycleTransactions(cycle.id, tx);
    const updatedComputation = computeCycleState(
      cycle.allowedLitres,
      mapTransactions(updatedTransactions),
      cycleIntervalDays,
      timezone,
    );
    const [updatedCycle] = await tx
      .update(petrolCycles)
      .set({
        status: updatedComputation.status,
        completedAt: updatedComputation.completedAt,
        nextEligibleAt: updatedComputation.nextEligibleAt,
        version: cycle.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(petrolCycles.id, cycle.id), eq(petrolCycles.version, cycle.version)))
      .returning();
    if (!updatedCycle) {
      throw new PetrolCycleError(my.errors.concurrentUpdate, 409, "CONCURRENT_UPDATE");
    }

    return loadCycleWithTransactions(updatedCycle, tx);
  });
}

export async function getPetrolHistory(vehicleId: string, userId: string) {
  const vehicle = await findOwnedActiveVehicle(vehicleId, userId);
  if (!vehicle) {
    throw new PetrolCycleError(my.errors.vehicleNotFound, 404, "VEHICLE_NOT_FOUND");
  }
  const cycles = await db
    .select()
    .from(petrolCycles)
    .where(eq(petrolCycles.vehicleId, vehicleId))
    .orderBy(desc(petrolCycles.cycleNumber));
  const { cycleIntervalDays, timezone } = await getAllocationAndInterval();

  return Promise.all(
    cycles.map(async (cycle) => {
      const withTransactions = await loadCycleWithTransactions(cycle);
      return {
        cycle: withTransactions,
        computation: computeCycleState(
          withTransactions.allowedLitres,
          mapTransactions(withTransactions.transactions),
          cycleIntervalDays,
          timezone,
        ),
      };
    }),
  );
}

export async function getVehiclePetrolSummary(
  vehicleId: string,
  userId: string,
  asOf = new Date(),
): Promise<VehiclePetrolSummary> {
  const [vehicle, settings] = await Promise.all([
    findOwnedActiveVehicle(vehicleId, userId),
    getAllocationAndInterval(),
  ]);
  if (!vehicle) {
    throw new PetrolCycleError(my.errors.vehicleNotFound, 404, "VEHICLE_NOT_FOUND");
  }

  const { allowedLitres, cycleIntervalDays, timezone } = settings;
  const drivingAllowed = isDrivingAllowedForParity(vehicle.plateParity, asOf, timezone);
  const cycleRecord = await findCurrentCycle(vehicleId);

  if (!cycleRecord) {
    return {
      allowedLitres,
      totalTaken: 0,
      remainingLitres: allowedLitres,
      status: "AVAILABLE",
      persistedStatus: null,
      cycleStartedAt: null,
      completedAt: null,
      nextEligibleAt: null,
      nextAllowedRefillAt: getNextDrivingAllowedDay(asOf, vehicle.plateParity, timezone),
      cycleNumber: null,
      isEligibleForNewCycle: true,
      drivingAllowed,
      canTakePetrol: drivingAllowed,
      blockedReason: drivingAllowed ? null : "DRIVING_RESTRICTED",
    };
  }

  const cycle = await loadCycleWithTransactions(cycleRecord);
  const computation = computeCycleState(
    cycle.allowedLitres,
    mapTransactions(cycle.transactions),
    cycleIntervalDays,
    timezone,
  );
  const eligible = isEligibleForNewCycle(computation, asOf, timezone);

  if (eligible) {
    const nextDrivingAnchor = computation.nextEligibleAt &&
      computation.nextEligibleAt.getTime() > startOfAppDay(asOf, timezone).getTime()
      ? computation.nextEligibleAt
      : asOf;
    return {
      allowedLitres,
      totalTaken: 0,
      remainingLitres: allowedLitres,
      status: "AVAILABLE",
      persistedStatus: cycle.status,
      cycleStartedAt: computation.cycleStartedAt,
      completedAt: computation.completedAt,
      nextEligibleAt: computation.nextEligibleAt,
      nextAllowedRefillAt: getNextDrivingAllowedDay(nextDrivingAnchor, vehicle.plateParity, timezone),
      cycleNumber: cycle.cycleNumber + 1,
      isEligibleForNewCycle: true,
      drivingAllowed,
      canTakePetrol: drivingAllowed,
      blockedReason: drivingAllowed ? null : "DRIVING_RESTRICTED",
    };
  }

  const open = computation.status === "OPEN" && computation.remainingLitres > 0;
  return {
    allowedLitres: cycle.allowedLitres,
    totalTaken: computation.totalTaken,
    remainingLitres: computation.remainingLitres,
    status: computation.status === "OPEN" ? "OPEN" : "COMPLETED",
    persistedStatus: cycle.status,
    cycleStartedAt: computation.cycleStartedAt,
    completedAt: computation.completedAt,
    nextEligibleAt: computation.nextEligibleAt,
    nextAllowedRefillAt: computation.nextEligibleAt
      ? getNextDrivingAllowedDay(open ? asOf : computation.nextEligibleAt, vehicle.plateParity, timezone)
      : null,
    cycleNumber: cycle.cycleNumber,
    isEligibleForNewCycle: false,
    drivingAllowed,
    canTakePetrol: open && drivingAllowed,
    blockedReason: open && !drivingAllowed ? "DRIVING_RESTRICTED" : open ? null : "ALLOCATION_COMPLETE",
  };
}
