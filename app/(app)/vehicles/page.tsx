import { and, asc, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { VehicleForm } from "@/components/vehicle-form";
import { my } from "@/lib/i18n/my";
import { VehicleManager } from "@/components/vehicle-manager";

export default async function VehiclesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
    .orderBy(asc(vehicles.createdAt));

  return (
    <div className="page-shell space-y-8">
      <div className="page-heading">
        <p className="eyebrow">VEHICLE DIRECTORY</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)] sm:text-[2.15rem]">{my.vehicle.pageTitle}</h1>
        <p className="mt-1 max-w-2xl text-[var(--muted)]">{my.vehicle.pageDesc}</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(19rem,0.78fr)_minmax(0,1.22fr)]">
        <div className="xl:sticky xl:top-8">
          <VehicleForm />
        </div>
        <VehicleManager
          key={rows.map((vehicle) => vehicle.id).join(":")}
          initialVehicles={rows.map(({ id, name, licensePlate, plateParity, paritySource }) => ({
            id,
            name,
            licensePlate,
            plateParity,
            paritySource,
          }))}
        />
      </div>
    </div>
  );
}
