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
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold leading-relaxed text-[var(--hero)]">{my.vehicle.pageTitle}</h1>
        <p className="mt-1 max-w-2xl text-[var(--muted)]">{my.vehicle.pageDesc}</p>
      </div>

      <VehicleForm />

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
  );
}
