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
    <article className="surface-panel overflow-hidden border-l-[4px] border-l-[var(--accent)]">
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{vehicle.licensePlate}</p>
            <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-[var(--hero)]">{vehicle.name}</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{parityLabel(vehicle.plateParity)}</p>
          </div>
          <span
            className={`flex min-h-10 w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold ${
              vehicle.drivingAllowed
                ? "border-[var(--ok)]/25 bg-[var(--ok-soft)] text-[var(--ok)]"
                : "border-[var(--bad)]/25 bg-[var(--bad-soft)] text-[var(--bad)]"
            }`}
          >
            <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-current text-xs text-white">
              <span className={vehicle.drivingAllowed ? "text-[var(--ok-soft)]" : "text-[var(--bad-soft)]"}>{vehicle.drivingAllowed ? "✓" : "×"}</span>
            </span>
            {vehicle.drivingAllowed ? my.vehicle.driveOk : my.vehicle.restricted}
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]">
          <div className="rounded-2xl bg-[var(--accent-soft)]/70 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">{my.vehicle.remaining(vehicle.remainingLitres)}</p>
                <p className="mt-1 font-serif text-4xl font-bold leading-none text-[var(--hero)] tabular-nums">
                  {vehicle.remainingLitres}<span className="ml-1.5 font-sans text-base font-bold text-[var(--muted)]">L</span>
                </p>
              </div>
              <p className="pb-1 text-right text-sm font-bold text-[var(--muted)] tabular-nums">
                {vehicle.totalTaken} / {vehicle.allowedLitres} L
              </p>
            </div>
            <div className="meter-track mt-5 h-3" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--muted)]">{my.vehicle.petrol}</p>
          </div>

          <dl className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-white/60 px-4 sm:px-5">
            <div className="py-3.5">
              <dt className="text-xs font-bold text-[var(--muted)]">{my.vehicle.cycleCompleted}</dt>
              <dd className="mt-1 font-semibold">
                {vehicle.completedAt ? formatAppDate(vehicle.completedAt, timezone) : my.vehicle.notCompleted}
              </dd>
            </div>
            <div className="py-3.5">
              <dt className="text-xs font-bold text-[var(--muted)]">{my.vehicle.nextAction}</dt>
              <dd className="mt-1 font-bold text-[var(--hero)]">{nextAction}</dd>
            </div>
          </dl>
        </div>
      </div>

      {vehicle.canTakePetrol ? (
        <AddPetrolForm vehicleId={vehicle.id} todayInput={todayInput} />
      ) : vehicle.blockedReason === "DRIVING_RESTRICTED" ? (
        <p className="border-t border-[var(--bad)]/15 bg-[var(--bad-soft)] px-5 py-4 font-semibold text-[var(--bad)] sm:px-7">
          {my.vehicle.drivingBlockedPetrol}
        </p>
      ) : null}
    </article>
  );
}
