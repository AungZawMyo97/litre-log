import { eq } from "drizzle-orm";
import { db, petrolCycles } from "@/lib/db";
import { my } from "@/lib/i18n/my";
import { getAppTimezone } from "@/lib/settings";
import { getCurrentCycle, getCycleComputation, getVehiclePetrolSummary, PetrolCycleError } from "@/lib/services/petrol-cycle-service";
import { findOwnedActiveVehicle } from "@/lib/services/petrol-cycle-repository";
import {
  buildCalendarDayStatus,
  getNextDrivingAllowedDay,
  isDrivingAllowedForParity,
} from "@/lib/services/vehicle-restriction-service";
import { getAppMonthDays, isSameAppDay, startOfAppDay } from "@/lib/timezone";

export async function getVehicleCalendar(
  vehicleId: string,
  userId: string,
  anchor: Date,
  asOf = new Date(),
) {
  const [vehicle, timezone] = await Promise.all([
    findOwnedActiveVehicle(vehicleId, userId),
    getAppTimezone(),
  ]);
  if (!vehicle) {
    throw new PetrolCycleError(my.errors.vehicleNotFound, 404, "VEHICLE_NOT_FOUND");
  }

  const [summary, currentCycle, cycles] = await Promise.all([
    getVehiclePetrolSummary(vehicleId, userId, asOf),
    getCurrentCycle(vehicleId, userId),
    db.select().from(petrolCycles).where(eq(petrolCycles.vehicleId, vehicleId)),
  ]);
  const computation = currentCycle ? await getCycleComputation(currentCycle) : null;
  const monthDays = getAppMonthDays(anchor, timezone);
  const today = startOfAppDay(asOf, timezone);

  const days = monthDays.map((date) => {
    const appDay = startOfAppDay(date, timezone);
    const drivingAllowed = isDrivingAllowedForParity(vehicle.plateParity, appDay, timezone);
    const completedOnDay = cycles.some(
      (cycle) => cycle.completedAt && isSameAppDay(cycle.completedAt, appDay, timezone),
    );

    let petrolRefillAvailable = false;
    if (appDay.getTime() >= today.getTime() && drivingAllowed) {
      if (!computation) {
        petrolRefillAvailable = true;
      } else if (computation.status === "OPEN" && computation.remainingLitres > 0) {
        petrolRefillAvailable = true;
      } else if (
        computation.nextEligibleAt &&
        appDay.getTime() >= computation.nextEligibleAt.getTime()
      ) {
        petrolRefillAvailable = true;
      }
    }

    return buildCalendarDayStatus(vehicle.plateParity, appDay, {
      timezone,
      petrolRefillAvailable,
      petrolCycleIncomplete:
        isSameAppDay(appDay, today, timezone) &&
        summary.status === "OPEN" &&
        summary.remainingLitres > 0,
      petrolCycleCompleted: completedOnDay,
    });
  });

  return {
    vehicle,
    summary,
    days,
    nextAllowedRefillAt: summary.nextEligibleAt
      ? getNextDrivingAllowedDay(summary.nextEligibleAt, vehicle.plateParity, timezone)
      : summary.nextAllowedRefillAt,
    timezone,
  };
}
