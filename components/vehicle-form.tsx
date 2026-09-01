"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { my } from "@/lib/i18n/my";

export function VehicleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [plateParity, setPlateParity] = useState<"" | "ODD" | "EVEN">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = loading || isPending;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          licensePlate,
          ...(plateParity ? { plateParity } : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? my.errors.createVehicleFailed);
        if (data.suggestedParity && !plateParity) {
          setPlateParity(data.suggestedParity);
        }
        return;
      }

      setName("");
      setLicensePlate("");
      setPlateParity("");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(my.errors.createVehicleFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-panel space-y-5 p-5 sm:p-6">
      <div>
        <p className="eyebrow">NEW VEHICLE</p>
        <h2 className="mt-2 font-display text-xl font-bold text-[var(--hero)]">{my.vehicle.addVehicle}</h2>
      </div>
      <label className="block space-y-2">
        <span className="font-semibold">{my.vehicle.nameLabel}</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          placeholder={my.vehicle.nicknamePlaceholder}
          className="field text-lg"
        />
      </label>
      <label className="block space-y-2">
        <span className="font-semibold">{my.vehicle.plateLabel}</span>
        <input
          required
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          disabled={busy}
          placeholder={my.vehicle.platePlaceholder}
          className="field text-lg"
        />
      </label>
      <label className="block space-y-2">
        <span className="font-semibold">{my.vehicle.parityLabel}</span>
        <select
          value={plateParity}
          onChange={(e) => setPlateParity(e.target.value as "" | "ODD" | "EVEN")}
          disabled={busy}
          className="field text-lg"
        >
          <option value="">{my.vehicle.autoDetectParity}</option>
          <option value="ODD">{my.vehicle.odd}</option>
          <option value="EVEN">{my.vehicle.even}</option>
        </select>
      </label>
      {error ? <p role="alert" className="rounded-xl border border-[var(--bad)]/15 bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="button-primary min-h-14 w-full"
      >
        {busy ? my.common.saving : my.vehicle.saveVehicle}
      </button>
    </form>
  );
}
