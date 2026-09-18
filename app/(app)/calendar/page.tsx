import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { db, vehicles } from "@/lib/db";
import { my } from "@/lib/i18n/my";
import { getAppTimezone } from "@/lib/settings";
import { getVehicleCalendar } from "@/lib/services/vehicle-calendar-service";
import { formatAppMonthYear, getTodayHeading, startOfAppDay } from "@/lib/timezone";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui-icons";
import { calendarMonthHref, getCalendarMonth } from "./calendar-month";
import { MonthCalendar } from "./month-calendar";

type CalendarPageProps = {
  searchParams: Promise<{ month?: string | string[] }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await getSessionUser();
  if (!user) return null;

  const [{ month }, timezone, userVehicles] = await Promise.all([
    searchParams,
    getAppTimezone(),
    db.select().from(vehicles)
      .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
      .orderBy(asc(vehicles.createdAt)),
  ]);
  const now = new Date();
  const anchor = getCalendarMonth(month, timezone, now);
  const today = startOfAppDay(now, timezone);
  const monthTitle = formatAppMonthYear(anchor, timezone);
  const vehicleCalendars = await Promise.all(
    userVehicles.map((vehicle) => getVehicleCalendar(vehicle.id, user.id, anchor, now)),
  );

  return (
    <div className="page-shell space-y-6">
      <header className="page-heading">
        <p className="eyebrow">DRIVING PLANNER</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)]">{my.calendar.title}</h1>
        <p className="mt-1 text-[var(--muted)]">{my.calendar.description}</p>
      </header>

      <section className="calendar-toolbar" aria-label={my.calendar.title}>
        <div>
          <h2 className="font-serif text-3xl leading-tight text-[var(--hero)] sm:text-4xl">{monthTitle}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{my.calendar.today} · {getTodayHeading(today, timezone)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{timezone}</p>
        </div>
        <nav className="flex items-center gap-2" aria-label={my.calendar.currentMonth}>
          <Link href={calendarMonthHref(anchor, timezone, -1)} aria-label={my.calendar.previousMonth} className="button-secondary min-w-12 px-0">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <Link href="/calendar" className="button-secondary">{my.calendar.currentMonth}</Link>
          <Link href={calendarMonthHref(anchor, timezone, 1)} aria-label={my.calendar.nextMonth} className="button-secondary min-w-12 px-0">
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </nav>
      </section>

      {vehicleCalendars.length > 0 ? (
        <ul className="calendar-legend">
          <li><span aria-hidden="true" className="calendar-driving is-allowed">✓</span>{my.calendar.drivingAllowed}</li>
          <li><span aria-hidden="true" className="calendar-driving is-restricted">−</span>{my.calendar.drivingRestricted}</li>
          <li><span aria-hidden="true" className="calendar-fuel">●</span>{my.calendar.petrolAvailable}</li>
          <li><span aria-hidden="true" className="calendar-incomplete">○</span>{my.calendar.cycleIncomplete}</li>
          <li><span aria-hidden="true" className="calendar-completed">◆</span>{my.calendar.cycleCompleted}</li>
          <li><span aria-hidden="true" className="calendar-today-key" />{my.calendar.today}</li>
        </ul>
      ) : null}

      {vehicleCalendars.map(({ vehicle, days }) => (
        <section key={vehicle.id} className="surface-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-[var(--hero)]">{vehicle.name}</h2>
            <span className="rounded-md border px-2.5 py-1 text-sm font-semibold tracking-wider text-[var(--muted)]">{vehicle.licensePlate}</span>
          </div>
          <MonthCalendar anchor={anchor} today={today} timezone={timezone} caption={vehicle.name + " · " + monthTitle} days={days} />
        </section>
      ))}

      {vehicleCalendars.length === 0 ? (
        <section className="surface-panel overflow-hidden">
          <MonthCalendar anchor={anchor} today={today} timezone={timezone} caption={monthTitle} />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t p-5">
            <p className="text-sm text-[var(--muted)]">{my.calendar.noVehicles}</p>
            <Link href="/vehicles" className="button-primary">{my.vehicle.addVehicle}</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
