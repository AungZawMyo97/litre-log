import { getDashboardVehicles } from "@/lib/dashboard";
import { getSessionUser } from "@/lib/auth";
import { VehicleCard } from "@/components/vehicle-card";
import { getTodayHeading } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const vehicles = await getDashboardVehicles(user.id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-[var(--hero)] px-5 py-6 text-white shadow-[0_18px_42px_rgba(23,63,53,0.2)]">
        <p className="text-sm font-bold uppercase text-white/75">{my.dashboard.today}</p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-snug sm:text-3xl">{getTodayHeading()}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">{my.dashboard.tagline}</p>
      </section>

      {vehicles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted)]">{my.dashboard.noVehicles}</p>
          <Link href="/vehicles" className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-5 py-3 font-bold text-white">
            {my.dashboard.addFirstVehicle}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
