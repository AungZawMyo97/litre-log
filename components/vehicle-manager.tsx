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
    <div className="space-y-4">
      {error ? <p role="alert" className="rounded-xl border border-[var(--bad)]/15 bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
      {items.map((vehicle) => (
        <article key={vehicle.id} className="surface-panel relative overflow-hidden p-5 sm:p-6">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[var(--accent)]/70" />
          {editingId === vehicle.id ? (
            <div className="grid gap-4">
              <div>
                <p className="eyebrow">EDIT VEHICLE</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--hero)]">{my.vehicle.editVehicle}</h2>
              </div>
              <label className="grid gap-2">
                <span className="font-semibold text-[var(--muted)]">{my.vehicle.nameLabel}</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} disabled={pending} className="field text-lg" />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-[var(--muted)]">{my.vehicle.plateLabel}</span>
                <input value={draft.licensePlate} onChange={(event) => setDraft((current) => ({ ...current, licensePlate: event.target.value }))} disabled={pending} className="field text-lg" />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-[var(--muted)]">{my.vehicle.parityLabel}</span>
                <select value={draft.plateParity} onChange={(event) => setDraft((current) => ({ ...current, plateParity: event.target.value as "ODD" | "EVEN" }))} disabled={pending} className="field text-lg">
                  <option value="ODD">{my.vehicle.odd}</option>
                  <option value="EVEN">{my.vehicle.even}</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending || !draft.name.trim() || !draft.licensePlate.trim()} onClick={() => save(vehicle.id)} className="button-primary">{my.vehicle.updateVehicle}</button>
                <button type="button" disabled={pending} onClick={() => setEditingId(null)} className="button-secondary">{my.common.cancel}</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">{vehicle.licensePlate}</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--hero)]">{vehicle.name}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-[var(--muted)]">
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">{parityLabelMy(vehicle.plateParity)}</span>
                  <span className="rounded-full bg-[var(--surface-deep)] px-3 py-1">{vehicle.paritySource === "manual" ? my.vehicle.manual : my.vehicle.auto}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={pending} onClick={() => beginEdit(vehicle)} className="button-secondary">{my.common.edit}</button>
                <button type="button" disabled={pending} onClick={() => archive(vehicle.id)} className="button-danger">{my.common.archive}</button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
