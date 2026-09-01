"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { my } from "@/lib/i18n/my";

export function AddPetrolForm({ vehicleId, todayInput }: { vehicleId: string; todayInput: string }) {
  const router = useRouter();
  const [litres, setLitres] = useState("");
  const [date, setDate] = useState(todayInput);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = loading || isPending;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/petrol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          litres: Number(litres),
          transactionAt: date,
        }),
      });

      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch {
        setError(my.errors.recordPetrolFailed);
        return;
      }

      if (!response.ok) {
        setError((data.error as string) ?? my.errors.recordPetrolFailed);
        return;
      }

      setLitres("");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(my.errors.recordPetrolFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 border-t border-[var(--line)] bg-[var(--surface)]/70 p-5 sm:p-7"
    >
      <div>
        <p className="eyebrow">PETROL ENTRY</p>
        <p className="mt-2 text-lg font-bold text-[var(--hero)]">{my.vehicle.recordRefill}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block space-y-2">
          <span className="font-semibold text-[var(--muted)]">
            {my.vehicle.litresLabel}
          </span>
          <input
            type="number"
            step="0.1"
            min="0.1"
            required
            value={litres}
            onChange={(e) => setLitres(e.target.value)}
            disabled={busy}
            placeholder={my.common.litres}
            className="field text-lg"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-semibold text-[var(--muted)]">
            {my.vehicle.dateLabel}
          </span>
          <input
            type="date"
            required
            max={todayInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={busy}
            className="field text-lg"
          />
        </label>
        <button type="submit" disabled={busy} className="button-primary min-h-14 whitespace-nowrap sm:px-6">
          {busy ? my.common.saving : my.vehicle.addRefill}
        </button>
      </div>
      {error ? <p role="alert" className="rounded-xl border border-[var(--bad)]/15 bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
    </form>
  );
}
