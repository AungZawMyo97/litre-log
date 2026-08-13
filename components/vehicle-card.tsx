import { formatAppDate } from "@/lib/timezone";
import { parityLabel } from "@/lib/services/license-plate-service";
import { my } from "@/lib/i18n/my";
import { AddPetrolForm } from "@/components/add-petrol-form";
import type { PlateParity } from "@/lib/db";

export type VehicleCardData = {
  id: string;
  name: string;
  licensePlate: string;
  plateParity: PlateParity;
  drivingAllowed: boolean;
  allowedLitres: number;
  totalTaken: number;
  remainingLitres: number;
  status: "OPEN" | "COMPLETED" | "SUPERSEDED";
  completedAt: Date | null;
  nextEligibleAt: Date | null;
  canTakePetrol: boolean;
};

export function VehicleCard({ vehicle }: { vehicle: VehicleCardData }) {
  const progress = vehicle.allowedLitres
    ? Math.min(100, (vehicle.totalTaken / vehicle.allowedLitres) * 100)
    : 0;
  const nextAction =
    vehicle.status === "OPEN" && vehicle.remainingLitres > 0
      ? my.vehicle.eligibleRemaining(vehicle.remainingLitres)
      : vehicle.nextEligibleAt
        ? my.vehicle.nextRefill(formatAppDate(vehicle.nextEligibleAt))
        : vehicle.canTakePetrol
          ? my.vehicle.petrolAvailable
          : my.vehicle.waitingNextCycle;

  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_14px_34px_rgba(28,37,32,0.08)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold leading-snug">{vehicle.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)] sm:text-base">
            {vehicle.licensePlate} - {parityLabel(vehicle.plateParity)}
          </p>
        </div>
        <span
          className={`w-fit rounded-lg px-3 py-1.5 text-sm font-bold ${
            vehicle.drivingAllowed
              ? "bg-[var(--ok-soft)] text-[var(--ok)]"
              : "bg-[var(--bad-soft)] text-[var(--bad)]"
          }`}
        >
          {vehicle.drivingAllowed ? my.vehicle.driveOk : my.vehicle.restricted}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--muted)]">{my.vehicle.petrol}</span>
          <span className="font-bold">
            {vehicle.totalTaken} / {vehicle.allowedLitres} L
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm font-semibold text-[var(--hero)] sm:text-base">{my.vehicle.remaining(vehicle.remainingLitres)}</p>
      </div>

      <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4">
        <div className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <span className="text-[var(--muted)]">{my.vehicle.cycleCompleted}</span>
          <span className="font-bold sm:text-right">
            {vehicle.completedAt ? formatAppDate(vehicle.completedAt) : my.vehicle.notCompleted}
          </span>
        </div>
        <div className="grid gap-1 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <span className="text-[var(--muted)]">{my.vehicle.nextAction}</span>
          <span className="font-bold text-[var(--hero)] sm:text-right">{nextAction}</span>
        </div>
      </div>

      {vehicle.canTakePetrol ? <AddPetrolForm vehicleId={vehicle.id} /> : null}
    </article>
  );
}
