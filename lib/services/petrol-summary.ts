import type { PetrolCycleStatus } from "@/lib/db/schema";

export type PetrolAvailabilityStatus = "AVAILABLE" | "OPEN" | "COMPLETED";

export type PetrolBlockedReason = "DRIVING_RESTRICTED" | "ALLOCATION_COMPLETE" | null;

export type VehiclePetrolSummary = {
  allowedLitres: number;
  totalTaken: number;
  remainingLitres: number;
  status: PetrolAvailabilityStatus;
  persistedStatus: PetrolCycleStatus | null;
  cycleStartedAt: Date | null;
  completedAt: Date | null;
  nextEligibleAt: Date | null;
  nextAllowedRefillAt: Date | null;
  cycleNumber: number | null;
  isEligibleForNewCycle: boolean;
  drivingAllowed: boolean;
  canTakePetrol: boolean;
  blockedReason: PetrolBlockedReason;
};
