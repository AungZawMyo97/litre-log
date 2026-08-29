import { formatAppDate } from "@/lib/timezone";
import { parityLabel } from "@/lib/services/license-plate-service";
import { my } from "@/lib/i18n/my";
import { AddPetrolForm } from "@/components/add-petrol-form";
import type { VehicleCardData } from "@/lib/dashboard-types";

export function VehicleCard({
  vehicle,
  todayInput,
  timezone,
}: {
  vehicle: VehicleCardData;
  todayInput: string;
  timezone: string;
}) {
  const progress = vehicle.allowedLitres
    ? Math.min(100, (vehicle.totalTaken / vehicle.allowedLitres) * 100)
    : 0;
  const nextAction =
    vehicle.blockedReason === "DRIVING_RESTRICTED"
      ? vehicle.nextAllowedRefillAt
        ? my.vehicle.nextRefill(formatAppDate(vehicle.nextAllowedRefillAt, timezone))
        : my.vehicle.drivingBlockedPetrol
      : vehicle.status === "AVAILABLE"
      ? vehicle.canTakePetrol
        ? my.vehicle.petrolAvailable
        : vehicle.nextAllowedRefillAt
          ? my.vehicle.nextRefill(formatAppDate(vehicle.nextAllowedRefillAt, timezone))
          : my.vehicle.drivingBlockedPetrol
      : vehicle.status === "OPEN" && vehicle.remainingLitres > 0
      ? my.vehicle.eligibleRemaining(vehicle.remainingLitres)
      : vehicle.nextAllowedRefillAt
        ? my.vehicle.nextRefill(formatAppDate(vehicle.nextAllowedRefillAt, timezone))
        : vehicle.canTakePetrol
          ? my.vehicle.petrolAvailable
          : my.vehicle.waitingNextCycle;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-card)]">
      <div className="p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold leading-snug">{vehicle.name}</h2>
          <p className="mt-1.5 text-base font-medium text-[var(--muted)]">
            {vehicle.licensePlate} - {parityLabel(vehicle.plateParity)}
          </p>
        </div>
        <span
          className={`flex min-h-10 w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-base font-bold ${
            vehicle.drivingAllowed
              ? "border-[var(--ok)]/25 bg-[var(--ok-soft)] text-[var(--ok)]"
              : "border-[var(--bad)]/25 bg-[var(--bad-soft)] text-[var(--bad)]"
          }`}
        >
          <span aria-hidden="true" className="text-lg leading-none">{vehicle.drivingAllowed ? "✓" : "×"}</span>
          {vehicle.drivingAllowed ? my.vehicle.driveOk : my.vehicle.restricted}
        </span>
      </div>

      <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-[var(--muted)]">{my.vehicle.petrol}</span>
          <span className="text-lg font-extrabold tabular-nums">
            {vehicle.totalTaken} / {vehicle.allowedLitres} L
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 font-bold text-[var(--hero)]">{my.vehicle.remaining(vehicle.remainingLitres)}</p>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-[var(--line)] pt-5">
        <div className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-[var(--muted)]">{my.vehicle.cycleCompleted}</dt>
          <dd className="font-bold sm:text-right">
            {vehicle.completedAt ? formatAppDate(vehicle.completedAt, timezone) : my.vehicle.notCompleted}
          </dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-[var(--muted)]">{my.vehicle.nextAction}</dt>
          <dd className="font-bold text-[var(--hero)] sm:text-right">{nextAction}</dd>
        </div>
      </dl>
      </div>

      {vehicle.canTakePetrol ? (
        <AddPetrolForm vehicleId={vehicle.id} todayInput={todayInput} />
      ) : vehicle.blockedReason === "DRIVING_RESTRICTED" ? (
        <p className="border-t border-[var(--bad)]/20 bg-[var(--bad-soft)] px-5 py-4 font-semibold text-[var(--bad)] sm:px-6">
          {my.vehicle.drivingBlockedPetrol}
        </p>
      ) : null}
    </article>
  );
}
