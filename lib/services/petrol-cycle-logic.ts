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
  cycleStartedAt: Date | null;
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
  const cycleStartedAt = sorted[0]
    ? startOfAppDay(sorted[0].transactionAt, timezone)
    : null;
  const nextEligibleAt = cycleStartedAt
    ? addAppDays(cycleStartedAt, cycleIntervalDays, timezone)
    : null;

  if (totalTaken < allowedLitres) {
    return {
      totalTaken,
      remainingLitres,
      status: "OPEN",
      cycleStartedAt,
      completedAt: null,
      nextEligibleAt,
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

  return {
    totalTaken,
    remainingLitres: 0,
    status: "COMPLETED",
    cycleStartedAt,
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
  if (!computation.nextEligibleAt) {
    return false;
  }

  const today = startOfAppDay(asOf, timezone);
  return today.getTime() >= computation.nextEligibleAt.getTime();
}

export function canUseCurrentAllocation(
  computation: CycleComputation,
  asOf: Date,
  timezone?: string,
): boolean {
  return (
    computation.status === "OPEN" &&
    computation.remainingLitres > 0 &&
    !isEligibleForNewCycle(computation, asOf, timezone)
  );
}
