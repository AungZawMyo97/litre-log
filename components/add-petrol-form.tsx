"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { my } from "@/lib/i18n/my";

export function AddPetrolForm({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [litres, setLitres] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
      className="mt-5 grid gap-4 border-t border-(--line) pt-5"
    >
      <p className="font-bold">{my.vehicle.recordRefill}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-(--muted)">
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
            className="min-h-12 w-full rounded-lg border border-(--line) px-4 disabled:bg-[var(--surface)] disabled:opacity-75"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-(--muted)">
            {my.vehicle.dateLabel}
          </span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={busy}
            className="min-h-12 w-full rounded-lg border border-(--line) px-4 disabled:bg-[var(--surface)] disabled:opacity-75"
          />
        </label>
      </div>
      {error ? <p className="text-xs text-(--bad)">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 rounded-lg bg-(--accent) px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {busy ? my.common.saving : my.vehicle.addRefill}
      </button>
    </form>
  );
}
