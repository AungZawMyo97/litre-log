import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, petrolCycles, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import { getVehiclePetrolSummary } from "@/lib/services/petrol-cycle-service";
import { buildCalendarDayStatus } from "@/lib/services/vehicle-restriction-service";
import { getAppTimezone } from "@/lib/settings";
import { startOfAppDay, addAppDays } from "@/lib/timezone";
import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns";

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
  const anchor = monthParam ? new Date(`${monthParam}-01T12:00:00+06:30`) : new Date();
  const rangeStart = startOfMonth(anchor);
  const rangeEnd = endOfMonth(anchor);

  const summary = await getVehiclePetrolSummary(id, user.id);
  const cycles = await db.select().from(petrolCycles).where(eq(petrolCycles.vehicleId, id));

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((date) => {
    const appDay = startOfAppDay(date, timezone);

    const completedOnDay = cycles.some(
      (cycle) =>
        cycle.completedAt &&
        startOfAppDay(cycle.completedAt, timezone).getTime() === appDay.getTime(),
    );

    const incompleteOnDay =
      summary.status === "OPEN" &&
      summary.remainingLitres > 0 &&
      appDay.getTime() === startOfAppDay(new Date(), timezone).getTime();

    const refillAvailable =
      summary.nextEligibleAt !== null &&
      appDay.getTime() === startOfAppDay(summary.nextEligibleAt, timezone).getTime();

    const eligibleWindow =
      summary.status === "COMPLETED" &&
      summary.nextEligibleAt &&
      appDay.getTime() >= startOfAppDay(summary.nextEligibleAt, timezone).getTime();

    return buildCalendarDayStatus(vehicle.plateParity, appDay, {
      timezone,
      petrolRefillAvailable: refillAvailable || Boolean(eligibleWindow),
      petrolCycleIncomplete: incompleteOnDay,
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
