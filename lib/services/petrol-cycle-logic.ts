import type { PetrolCycleStatus } from "@/lib/db";
import { my } from "@/lib/i18n/my";
import { addAppDays, startOfAppDay } from "@/lib/timezone";

export type TransactionInput = {
  litres: number;
  transactionAt: Date;
};

export type CycleComputation = {
  totalTaken: number;
  remainingLitres: number;
  status: PetrolCycleStatus;
  completedAt: Date | null;
  nextEligibleAt: Date | null;
  completionTransactionDate: Date | null;
};

export function sumTransactionLitres(transactions: TransactionInput[]): number {
  return transactions.reduce((sum, tx) => sum + tx.litres, 0);
}

export function computeCycleState(
  allowedLitres: number,
  transactions: TransactionInput[],
  cycleIntervalDays: number,
  timezone?: string,
): CycleComputation {
  const sorted = [...transactions].sort(
    (a, b) => a.transactionAt.getTime() - b.transactionAt.getTime(),
  );
  const totalTaken = sumTransactionLitres(sorted);
  const remainingLitres = Math.max(0, allowedLitres - totalTaken);

  if (totalTaken < allowedLitres) {
    return {
      totalTaken,
      remainingLitres,
      status: "OPEN",
      completedAt: null,
      nextEligibleAt: null,
      completionTransactionDate: null,
    };
  }

  let running = 0;
  let completionTransactionDate: Date | null = null;

  for (const tx of sorted) {
    running += tx.litres;
    if (running >= allowedLitres) {
      completionTransactionDate = startOfAppDay(tx.transactionAt, timezone);
      break;
    }
  }

  const completedAt = completionTransactionDate;
  const nextEligibleAt = completedAt
    ? addAppDays(completedAt, cycleIntervalDays, timezone)
    : null;

  return {
    totalTaken,
    remainingLitres: 0,
    status: "COMPLETED",
    completedAt,
    nextEligibleAt,
    completionTransactionDate,
  };
}

export function validateTransactionLitres(
  litres: number,
  remainingLitres: number,
): { valid: true } | { valid: false; message: string } {
  if (!Number.isFinite(litres) || litres <= 0) {
    return { valid: false, message: my.errors.litresPositive };
  }

  if (litres > remainingLitres + 1e-9) {
    return {
      valid: false,
      message: my.errors.litresMax(remainingLitres),
    };
  }

  return { valid: true };
}

export function isEligibleForNewCycle(
  computation: CycleComputation,
  asOf: Date,
  timezone?: string,
): boolean {
  if (computation.status !== "COMPLETED" || !computation.nextEligibleAt) {
    return computation.status === "OPEN" && computation.remainingLitres > 0;
  }

  const today = startOfAppDay(asOf, timezone);
  return today.getTime() >= computation.nextEligibleAt.getTime();
}

export function canRecordTransaction(
  computation: CycleComputation,
  asOf: Date,
  timezone?: string,
): boolean {
  if (computation.status === "OPEN" && computation.remainingLitres > 0) {
    return true;
  }

  if (computation.status === "COMPLETED") {
    return isEligibleForNewCycle(computation, asOf, timezone);
  }

  return false;
}
