import { and, asc, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { VehicleForm } from "@/components/vehicle-form";
import { parityLabel } from "@/lib/services/license-plate-service";
import { my } from "@/lib/i18n/my";

export default async function VehiclesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
    .orderBy(asc(vehicles.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{my.vehicle.pageTitle}</h1>
        <p className="mt-1 text-base text-[var(--muted)]">{my.vehicle.pageDesc}</p>
      </div>

      <VehicleForm />

      <div className="space-y-3">
        {rows.map((vehicle) => (
          <article key={vehicle.id} className="rounded-lg border border-[var(--line)] bg-[var(--card)] p-5">
            <h2 className="text-lg font-bold">{vehicle.name}</h2>
            <p className="mt-1 text-base text-[var(--muted)]">
              {vehicle.licensePlate} - {parityLabel(vehicle.plateParity)} -{" "}
              {vehicle.paritySource === "manual" ? my.vehicle.manual : my.vehicle.auto}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
