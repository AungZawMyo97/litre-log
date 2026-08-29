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
      className="grid gap-5 border-t border-[var(--line)] bg-[#f8fbfd] p-5 sm:p-6"
    >
      <p className="text-lg font-bold text-[var(--hero)]">{my.vehicle.recordRefill}</p>
      <div className="grid gap-4 sm:grid-cols-2">
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
            className="min-h-14 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg shadow-sm disabled:bg-[var(--surface)] disabled:opacity-75"
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
            className="min-h-14 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg shadow-sm disabled:bg-[var(--surface)] disabled:opacity-75"
          />
        </label>
      </div>
      {error ? <p role="alert" className="rounded-xl bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-14 rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-white shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {busy ? my.common.saving : my.vehicle.addRefill}
      </button>
    </form>
  );
}
