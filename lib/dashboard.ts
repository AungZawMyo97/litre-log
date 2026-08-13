import { and, asc, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getVehiclePetrolSummary } from "@/lib/services/petrol-cycle-service";
import { syncDailyNotifications } from "@/lib/services/notification-service";
import { getAppTimezone } from "@/lib/settings";
import { isDrivingAllowedForParity } from "@/lib/services/vehicle-restriction-service";
import type { VehicleCardData } from "@/components/vehicle-card";

export async function getDashboardVehicles(userId: string): Promise<VehicleCardData[]> {
  await syncDailyNotifications(userId);

  const timezone = await getAppTimezone();
  const today = new Date();
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
        drivingAllowed: isDrivingAllowedForParity(vehicle.plateParity, today, timezone),
        allowedLitres: summary.allowedLitres,
        totalTaken: summary.totalTaken,
        remainingLitres: summary.remainingLitres,
        status: summary.status,
        completedAt: summary.completedAt,
        nextEligibleAt: summary.nextEligibleAt,
        canTakePetrol: summary.canTakePetrol,
      };
    }),
  );
}
