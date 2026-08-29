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
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-2xl bg-[var(--hero)] px-5 py-7 text-white shadow-[0_16px_38px_rgba(24,59,91,0.18)] sm:px-7 sm:py-8">
        <div aria-hidden="true" className="absolute -right-12 -top-20 h-52 w-52 rounded-full border-[34px] border-white/5" />
        <div className="relative">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-white/75">{my.dashboard.today}</p>
        <h1 className="mt-2 font-display text-2xl font-bold leading-relaxed sm:text-3xl">{getTodayHeading(now, timezone)}</h1>
        <p className="mt-3 max-w-2xl leading-8 text-white/90">{my.dashboard.tagline}</p>
        </div>
      </section>

      {vehicles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-[var(--muted)]">{my.dashboard.noVehicles}</p>
          <Link href="/vehicles" className="mt-5 inline-grid min-h-12 place-items-center rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-white hover:bg-[var(--accent-hover)]">
            {my.dashboard.addFirstVehicle}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} todayInput={todayInput} timezone={timezone} />
          ))}
        </div>
      )}
    </div>
  );
}
