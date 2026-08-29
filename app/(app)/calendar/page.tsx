import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db, vehicles } from "@/lib/db";
import { and, asc, eq } from "drizzle-orm";
import { my } from "@/lib/i18n/my";
import { getAppTimezone } from "@/lib/settings";
import { getVehicleCalendar } from "@/lib/services/vehicle-calendar-service";
import {
  addAppMonths,
  formatAppDateInput,
  formatAppMonthYear,
  getAppDayOfMonth,
  isSameAppDay,
  parseAppDateInput,
  startOfAppDay,
} from "@/lib/timezone";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui-icons";

type CalendarPageProps = {
  searchParams: Promise<{ month?: string }>;
};

function monthHref(date: Date, timezone: string) {
  return `/calendar?month=${formatAppDateInput(date, timezone).slice(0, 7)}`;
}

function parseMonth(month: string | undefined, timezone: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return new Date();
  try {
    return parseAppDateInput(`${month}-01`, timezone);
  } catch {
    return new Date();
  }
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const [{ month }, timezone, userVehicles] = await Promise.all([
    searchParams,
    getAppTimezone(),
    db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
      .orderBy(asc(vehicles.createdAt)),
  ]);
  const anchor = parseMonth(month, timezone);
  const today = startOfAppDay(new Date(), timezone);
  const vehicleCalendars = await Promise.all(
    userVehicles.map((vehicle) => getVehicleCalendar(vehicle.id, user.id, anchor)),
  );

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold leading-relaxed text-[var(--hero)]">{my.calendar.title}</h1>
          <p className="mt-1 text-base text-[var(--muted)]">
            {formatAppMonthYear(anchor, timezone)} {my.calendar.descSuffix}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={monthHref(addAppMonths(anchor, -1, timezone), timezone)}
            aria-label={my.common.previous}
            className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-[var(--line-strong)] bg-[var(--card)] text-[var(--hero)] shadow-sm hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <Link
            href={monthHref(addAppMonths(anchor, 1, timezone), timezone)}
            aria-label={my.common.next}
            className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-[var(--line-strong)] bg-[var(--card)] text-[var(--hero)] shadow-sm hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            <ArrowRightIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        <span className="rounded-xl border border-[var(--ok)]/25 bg-[var(--ok-soft)] px-3 py-2.5 font-bold text-[var(--ok)]">✓ {my.calendar.drivingAllowed}</span>
        <span className="rounded-xl border border-[var(--bad)]/25 bg-[var(--bad-soft)] px-3 py-2.5 font-bold text-[var(--bad)]">× {my.calendar.drivingRestricted}</span>
        <span className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2.5 font-bold text-[var(--hero)]">{my.calendar.petrolAvailable}</span>
        <span className="rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--card)] px-3 py-2.5 font-bold text-[var(--hero)]">{my.calendar.cycleIncomplete}</span>
        <span className="rounded-xl border-2 border-[var(--ink)] bg-[var(--card)] px-3 py-2.5 font-bold">{my.calendar.today}</span>
      </div>

      {vehicleCalendars.map(({ vehicle, days }) => (
        <section key={vehicle.id} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-xl font-bold text-[var(--hero)]">{vehicle.name} - {vehicle.licensePlate}</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const dayNum = getAppDayOfMonth(day.date, timezone);
              const isToday = isSameAppDay(day.date, today, timezone);
              const tone = day.drivingAllowed ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]";
              const petrolTone = day.petrolRefillAvailable
                ? "bg-[var(--accent-soft)] border-[var(--accent)]"
                : day.petrolCycleIncomplete
                  ? "border-dashed border-[var(--accent)]"
                  : "border-transparent";

              return (
                <div
                  key={day.date.toISOString()}
                  aria-label={`${dayNum}, ${day.drivingAllowed ? my.calendar.drivingAllowed : my.calendar.drivingRestricted}`}
                  className={`grid min-h-12 place-items-center rounded-lg border-2 p-1 text-center text-base font-extrabold tabular-nums ${tone} ${petrolTone} ${day.petrolCycleCompleted ? "ring-2 ring-[var(--accent)]" : ""} ${isToday ? "ring-2 ring-[var(--ink)] ring-offset-2" : ""}`}
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
