import { and, asc, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getVehiclePetrolSummary } from "@/lib/services/petrol-cycle-service";
import type { VehicleCardData } from "@/lib/dashboard-types";

export async function getDashboardVehicles(userId: string): Promise<VehicleCardData[]> {
  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, userId), eq(vehicles.isActive, true)))
    .orderBy(asc(vehicles.createdAt));

  return Promise.all(
    rows.map(async (vehicle) => {
      const summary = await getVehiclePetrolSummary(vehicle.id, userId);
      return {
        id: vehicle.id,
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        plateParity: vehicle.plateParity,
        drivingAllowed: summary.drivingAllowed,
        allowedLitres: summary.allowedLitres,
        totalTaken: summary.totalTaken,
        remainingLitres: summary.remainingLitres,
        status: summary.status,
        cycleStartedAt: summary.cycleStartedAt,
        completedAt: summary.completedAt,
        nextEligibleAt: summary.nextEligibleAt,
        nextAllowedRefillAt: summary.nextAllowedRefillAt,
        canTakePetrol: summary.canTakePetrol,
        blockedReason: summary.blockedReason,
      };
    }),
  );
}
