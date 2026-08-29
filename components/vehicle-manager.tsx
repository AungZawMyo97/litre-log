"use client";

import { useState, useTransition } from "react";
import { my, parityLabelMy } from "@/lib/i18n/my";

type VehicleItem = {
  id: string;
  name: string;
  licensePlate: string;
  plateParity: "ODD" | "EVEN";
  paritySource: string;
};

export function VehicleManager({ initialVehicles }: { initialVehicles: VehicleItem[] }) {
  const [items, setItems] = useState(initialVehicles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", licensePlate: "", plateParity: "ODD" as "ODD" | "EVEN" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function beginEdit(vehicle: VehicleItem) {
    setError(null);
    setEditingId(vehicle.id);
    setDraft({ name: vehicle.name, licensePlate: vehicle.licensePlate, plateParity: vehicle.plateParity });
  }

  function save(vehicleId: string) {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? my.errors.invalidVehicleData);
        setItems((current) => current.map((item) => (item.id === vehicleId ? data.vehicle : item)));
        setEditingId(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : my.errors.unexpected);
      }
    });
  }

  function archive(vehicleId: string) {
    if (!window.confirm(my.vehicle.archiveConfirm)) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
        if (!response.ok) throw new Error(my.errors.invalidVehicleData);
        setItems((current) => current.filter((item) => item.id !== vehicleId));
        if (editingId === vehicleId) setEditingId(null);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : my.errors.unexpected);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p role="alert" className="rounded-xl bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
      {items.map((vehicle) => (
        <article key={vehicle.id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          {editingId === vehicle.id ? (
            <div className="grid gap-4">
              <h2 className="text-xl font-bold text-[var(--hero)]">{my.vehicle.editVehicle}</h2>
              <label className="grid gap-2">
                <span className="font-semibold text-[var(--muted)]">{my.vehicle.nameLabel}</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} disabled={pending} className="min-h-14 rounded-xl border border-[var(--line-strong)] px-4 text-lg shadow-sm" />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-[var(--muted)]">{my.vehicle.plateLabel}</span>
                <input value={draft.licensePlate} onChange={(event) => setDraft((current) => ({ ...current, licensePlate: event.target.value }))} disabled={pending} className="min-h-14 rounded-xl border border-[var(--line-strong)] px-4 text-lg shadow-sm" />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-[var(--muted)]">{my.vehicle.parityLabel}</span>
                <select value={draft.plateParity} onChange={(event) => setDraft((current) => ({ ...current, plateParity: event.target.value as "ODD" | "EVEN" }))} disabled={pending} className="min-h-14 rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg shadow-sm">
                  <option value="ODD">{my.vehicle.odd}</option>
                  <option value="EVEN">{my.vehicle.even}</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending || !draft.name.trim() || !draft.licensePlate.trim()} onClick={() => save(vehicle.id)} className="min-h-12 rounded-xl bg-[var(--accent)] px-5 font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60">{my.vehicle.updateVehicle}</button>
                <button type="button" disabled={pending} onClick={() => setEditingId(null)} className="min-h-12 rounded-xl border border-[var(--line-strong)] px-5 font-bold hover:bg-[var(--surface)]">{my.common.cancel}</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--hero)]">{vehicle.name}</h2>
                <p className="mt-1.5 text-base font-medium text-[var(--muted)]">
                  {vehicle.licensePlate} - {parityLabelMy(vehicle.plateParity)} - {vehicle.paritySource === "manual" ? my.vehicle.manual : my.vehicle.auto}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => beginEdit(vehicle)} className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-white px-5 font-bold hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">{my.common.edit}</button>
                <button type="button" disabled={pending} onClick={() => archive(vehicle.id)} className="min-h-12 rounded-xl border border-[var(--bad)]/60 bg-white px-5 font-bold text-[var(--bad)] hover:bg-[var(--bad-soft)]">{my.common.archive}</button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
