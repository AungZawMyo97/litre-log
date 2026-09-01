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
    <div className="page-shell space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="page-heading">
          <p className="eyebrow">DRIVING PLANNER</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)] sm:text-[2.15rem]">{my.calendar.title}</h1>
          <p className="mt-1 text-base text-[var(--muted)]">
            {formatAppMonthYear(anchor, timezone)} {my.calendar.descSuffix}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={monthHref(addAppMonths(anchor, -1, timezone), timezone)}
            aria-label={my.common.previous}
            className="button-secondary min-w-12 px-0"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <Link
            href={monthHref(addAppMonths(anchor, 1, timezone), timezone)}
            aria-label={my.common.next}
            className="button-secondary min-w-12 px-0"
          >
            <ArrowRightIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>

      <div className="surface-panel flex flex-wrap gap-x-5 gap-y-3 px-4 py-3.5 text-sm">
        <span className="flex items-center gap-2 font-bold text-[var(--ok)]"><i aria-hidden="true" className="h-3 w-3 rounded-full bg-[var(--ok)]" />{my.calendar.drivingAllowed}</span>
        <span className="flex items-center gap-2 font-bold text-[var(--bad)]"><i aria-hidden="true" className="h-3 w-3 rounded-full bg-[var(--bad)]" />{my.calendar.drivingRestricted}</span>
        <span className="flex items-center gap-2 font-bold text-[var(--hero)]"><i aria-hidden="true" className="h-3 w-3 rounded-sm border-2 border-[var(--accent)] bg-[var(--accent-soft)]" />{my.calendar.petrolAvailable}</span>
        <span className="flex items-center gap-2 font-bold text-[var(--hero)]"><i aria-hidden="true" className="h-3 w-3 rounded-sm border-2 border-dashed border-[var(--accent)]" />{my.calendar.cycleIncomplete}</span>
        <span className="flex items-center gap-2 font-bold"><i aria-hidden="true" className="h-3 w-3 rounded-sm border-2 border-[var(--ink)] bg-white" />{my.calendar.today}</span>
      </div>

      {vehicleCalendars.map(({ vehicle, days }) => (
        <section key={vehicle.id} className="surface-panel space-y-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
            <h2 className="text-xl font-bold text-[var(--hero)]">{vehicle.name}</h2>
            <span className="eyebrow">{vehicle.licensePlate}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                  className={`grid min-h-12 place-items-center rounded-xl border-2 p-1 text-center text-base font-extrabold tabular-nums sm:min-h-14 ${tone} ${petrolTone} ${day.petrolCycleCompleted ? "ring-2 ring-[var(--accent)]" : ""} ${isToday ? "ring-2 ring-[var(--ink)] ring-offset-2" : ""}`}
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
