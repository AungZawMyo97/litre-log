import type { PlateParity } from "@/lib/db/schema";
import type {
  PetrolAvailabilityStatus,
  PetrolBlockedReason,
} from "@/lib/services/petrol-summary";

export type VehicleCardData = {
  id: string;
  name: string;
  licensePlate: string;
  plateParity: PlateParity;
  drivingAllowed: boolean;
  allowedLitres: number;
  totalTaken: number;
  remainingLitres: number;
  status: PetrolAvailabilityStatus;
  cycleStartedAt: Date | null;
  completedAt: Date | null;
  nextEligibleAt: Date | null;
  nextAllowedRefillAt: Date | null;
  canTakePetrol: boolean;
  blockedReason: PetrolBlockedReason;
};
