import { getDashboardVehicles } from "@/lib/dashboard";
import { getSessionUser } from "@/lib/auth";
import { VehicleCard } from "@/components/vehicle-card";
import { formatAppDateInput, getTodayHeading } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";
import Link from "next/link";
import { getAppTimezone } from "@/lib/settings";

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
      <section className="surface-panel relative overflow-hidden sm:grid sm:grid-cols-[minmax(0,1.45fr)_minmax(13rem,0.55fr)]">
        <div className="relative px-5 py-7 sm:px-8 sm:py-9">
          <p className="eyebrow">{my.dashboard.today}</p>
          <h1 className="mt-3 max-w-2xl font-display text-[1.75rem] font-bold leading-[1.65] text-[var(--hero)] sm:text-[2.15rem]">
            {getTodayHeading(now, timezone)}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)] sm:text-[1.05rem]">{my.dashboard.tagline}</p>
        </div>
        <div className="relative hidden min-h-56 overflow-hidden bg-[var(--nav)] p-7 text-white sm:flex sm:flex-col sm:justify-between">
          <div aria-hidden="true" className="absolute -right-16 -top-14 h-52 w-52 rounded-full border-[32px] border-white/[0.045]" />
          <p className="relative font-serif text-sm font-bold tracking-[0.22em] text-white/55">LITRE / LOG</p>
          <div aria-hidden="true" className="relative space-y-3">
            {["w-full", "w-4/5", "w-3/5", "w-2/5"].map((width) => (
              <div key={width} className={`h-px ${width} bg-white/25`} />
            ))}
          </div>
        </div>
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
