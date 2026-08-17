import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, petrolCycles, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import { getVehiclePetrolSummary } from "@/lib/services/petrol-cycle-service";
import {
  buildCalendarDayStatus,
  getNextDrivingAllowedDay,
  isDrivingAllowedForParity,
} from "@/lib/services/vehicle-restriction-service";
import { getAppTimezone } from "@/lib/settings";
import { startOfAppDay, addAppDays, getAppMonthDays, parseAppDateInput, isSameAppDay } from "@/lib/timezone";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
    .limit(1);

  if (!vehicle) {
    return NextResponse.json({ error: my.errors.vehicleNotFound }, { status: 404 });
  }

  const timezone = await getAppTimezone();
  const anchor = monthParam ? parseAppDateInput(`${monthParam}-01`, timezone) : new Date();
  const monthDays = getAppMonthDays(anchor, timezone);
  const rangeStart = startOfAppDay(monthDays[0] ?? anchor, timezone);
  const rangeEnd = startOfAppDay(monthDays[monthDays.length - 1] ?? anchor, timezone);
  const today = startOfAppDay(new Date(), timezone);

  const summary = await getVehiclePetrolSummary(id, user.id);
  const cycles = await db.select().from(petrolCycles).where(eq(petrolCycles.vehicleId, id));

  const days = monthDays.map((date) => {
    const appDay = startOfAppDay(date, timezone);

    const completedOnDay = cycles.some(
      (cycle) =>
        cycle.completedAt &&
        startOfAppDay(cycle.completedAt, timezone).getTime() === appDay.getTime(),
    );

    const rawNextEligibleDay = summary.nextEligibleAt
      ? startOfAppDay(summary.nextEligibleAt, timezone)
      : null;

    const nextEligibleDay = rawNextEligibleDay
      ? getNextDrivingAllowedDay(rawNextEligibleDay, vehicle.plateParity, timezone)
      : null;

    const refillAvailable =
      nextEligibleDay !== null &&
      appDay.getTime() >= nextEligibleDay.getTime() &&
      isDrivingAllowedForParity(vehicle.plateParity, appDay, timezone);

    const isToday = isSameAppDay(appDay, today, timezone);

    return buildCalendarDayStatus(vehicle.plateParity, appDay, {
      timezone,
      petrolRefillAvailable: refillAvailable,
      petrolCycleIncomplete: isToday && summary.status === "OPEN" && summary.remainingLitres > 0,
      petrolCycleCompleted: completedOnDay,
    });
  });

  return NextResponse.json({
    vehicle,
    summary,
    days: days.map((day) => ({
      ...day,
      date: day.date.toISOString(),
    })),
    nextEligibleAt: summary.nextEligibleAt?.toISOString() ?? null,
    monthStart: rangeStart.toISOString(),
    monthEnd: addAppDays(rangeEnd, 0, timezone).toISOString(),
  });
}
