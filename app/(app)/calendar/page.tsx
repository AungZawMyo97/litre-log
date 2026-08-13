import { and, asc, eq } from "drizzle-orm";
import { db, petrolCycles, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getVehiclePetrolSummary } from "@/lib/services/petrol-cycle-service";
import { buildCalendarDayStatus } from "@/lib/services/vehicle-restriction-service";
import { getAppTimezone } from "@/lib/settings";
import { formatAppMonthYear, startOfAppDay } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";
import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns";

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const userVehicles = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
    .orderBy(asc(vehicles.createdAt));

  const timezone = await getAppTimezone();
  const anchor = new Date();
  const rangeStart = startOfMonth(anchor);
  const rangeEnd = endOfMonth(anchor);

  const vehicleCalendars = await Promise.all(
    userVehicles.map(async (vehicle) => {
      const summary = await getVehiclePetrolSummary(vehicle.id, user.id);
      const cycles = await db.select().from(petrolCycles).where(eq(petrolCycles.vehicleId, vehicle.id));

      const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((date) => {
        const appDay = startOfAppDay(date, timezone);
        const completedOnDay = cycles.some(
          (cycle) =>
            cycle.completedAt &&
            startOfAppDay(cycle.completedAt, timezone).getTime() === appDay.getTime(),
        );

        const refillAvailable =
          summary.nextEligibleAt !== null &&
          appDay.getTime() >= startOfAppDay(summary.nextEligibleAt, timezone).getTime();

        return buildCalendarDayStatus(vehicle.plateParity, appDay, {
          timezone,
          petrolRefillAvailable: refillAvailable,
          petrolCycleIncomplete: summary.status === "OPEN" && summary.remainingLitres > 0,
          petrolCycleCompleted: completedOnDay,
        });
      });

      return { vehicle, days };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{my.calendar.title}</h1>
        <p className="mt-1 text-base text-[var(--muted)]">
          {formatAppMonthYear(anchor)} {my.calendar.descSuffix}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <span className="rounded-lg bg-[var(--ok-soft)] px-3 py-2 font-semibold">{my.calendar.drivingAllowed}</span>
        <span className="rounded-lg bg-[var(--bad-soft)] px-3 py-2 font-semibold">{my.calendar.drivingRestricted}</span>
        <span className="rounded-lg border-2 border-[var(--accent)] bg-[var(--card)] px-3 py-2 font-semibold">
          {my.calendar.petrolAvailable}
        </span>
        <span className="rounded-lg border-2 border-dashed border-[var(--accent)] bg-[var(--card)] px-3 py-2 font-semibold">
          {my.calendar.cycleIncomplete}
        </span>
      </div>

      {vehicleCalendars.map(({ vehicle, days }) => (
        <section key={vehicle.id} className="space-y-3">
          <h2 className="text-lg font-bold">
            {vehicle.name} - {vehicle.licensePlate}
          </h2>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayNum = day.date.getDate();
              const tone = day.drivingAllowed ? "bg-[var(--ok-soft)]" : "bg-[var(--bad-soft)]";
              const petrolTone = day.petrolRefillAvailable
                ? "border-[var(--accent)]"
                : day.petrolCycleIncomplete
                  ? "border-dashed border-[var(--accent)]"
                  : "border-transparent";
              const completionTone = day.petrolCycleCompleted ? "ring-2 ring-[var(--accent)]" : "";

              return (
                <div
                  key={day.date.toISOString()}
                  className={`min-h-11 rounded-lg border-2 p-2 text-center text-sm font-bold ${tone} ${petrolTone} ${completionTone}`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
