"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { my } from "@/lib/i18n/my";

export function VehicleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [plateParity, setPlateParity] = useState<"" | "ODD" | "EVEN">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
    setLoading(false);

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
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-[var(--line)] bg-[var(--card)] p-5">
      <h2 className="font-display text-xl font-bold">{my.vehicle.addVehicle}</h2>
      <label className="block space-y-2">
        <span className="font-semibold">{my.vehicle.nameLabel}</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={my.vehicle.nicknamePlaceholder}
          className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4"
        />
      </label>
      <label className="block space-y-2">
        <span className="font-semibold">{my.vehicle.plateLabel}</span>
        <input
          required
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          placeholder={my.vehicle.platePlaceholder}
          className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4"
        />
      </label>
      <label className="block space-y-2">
        <span className="font-semibold">{my.vehicle.parityLabel}</span>
        <select
          value={plateParity}
          onChange={(e) => setPlateParity(e.target.value as "" | "ODD" | "EVEN")}
          className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4"
        >
          <option value="">{my.vehicle.autoDetectParity}</option>
          <option value="ODD">{my.vehicle.odd}</option>
          <option value="EVEN">{my.vehicle.even}</option>
        </select>
      </label>
      {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-12 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {loading ? my.common.saving : my.vehicle.saveVehicle}
      </button>
    </form>
  );
}
