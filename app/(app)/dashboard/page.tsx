import { getDashboardVehicles } from "@/lib/dashboard";
import { getSessionUser } from "@/lib/auth";
import { VehicleCard } from "@/components/vehicle-card";
import { formatAppDateInput, getTodayHeading } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";
import Link from "next/link";
import { getAppTimezone } from "@/lib/settings";
import { ArrowRightIcon, CalendarIcon } from "@/components/ui-icons";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [vehicles, timezone] = await Promise.all([
    getDashboardVehicles(user.id),
    getAppTimezone(),
  ]);
  const now = new Date();
  const todayInput = formatAppDateInput(now, timezone);

  return (
    <div className="page-shell space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-5 border-b pb-7">
        <div className="max-w-2xl">
          <p className="eyebrow">{my.dashboard.today}</p>
          <h1 className="mt-3 max-w-2xl font-display text-[1.75rem] font-bold leading-[1.65] text-[var(--hero)] sm:text-[2.15rem]">
            {getTodayHeading(now, timezone)}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)] sm:text-[1.05rem]">{my.dashboard.tagline}</p>
        </div>
        <Link href="/calendar" className="button-secondary">
          <span className="flex items-center gap-2.5">
            <CalendarIcon className="h-5 w-5" />
            {my.calendar.viewCalendar}
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </Link>
      </section>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <p className="text-[var(--muted)]">{my.dashboard.noVehicles}</p>
          <Link href="/vehicles" className="button-primary mt-5">
            {my.dashboard.addFirstVehicle}
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} todayInput={todayInput} timezone={timezone} />
          ))}
        </div>
      )}
    </div>
  );
}
