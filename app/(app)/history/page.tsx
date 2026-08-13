import { and, asc, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getPetrolHistory } from "@/lib/services/petrol-cycle-service";
import { formatAppDate } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const userVehicles = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
    .orderBy(asc(vehicles.createdAt));

  const histories = await Promise.all(
    userVehicles.map(async (vehicle) => ({
      vehicle,
      history: await getPetrolHistory(vehicle.id, user.id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{my.history.title}</h1>
        <p className="mt-1 text-base text-[var(--muted)]">{my.history.desc}</p>
      </div>

      {histories.map(({ vehicle, history }) => (
        <section key={vehicle.id} className="space-y-3">
          <h2 className="text-lg font-bold">
            {vehicle.name} - {vehicle.licensePlate}
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{my.history.noCycles}</p>
          ) : (
            history.map(({ cycle, computation }) => (
              <article key={cycle.id} className="rounded-lg border border-[var(--line)] bg-[var(--card)] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold">{my.history.cycle(cycle.cycleNumber)}</h3>
                  <span className="rounded-lg bg-[var(--surface)] px-3 py-1 text-sm font-semibold text-[var(--muted)]">
                    {my.status[computation.status]}
                  </span>
                </div>
                <ul className="space-y-2 text-base">
                  {cycle.transactions.map((tx) => (
                    <li key={tx.id} className="flex justify-between">
                      <span>{formatAppDate(tx.transactionAt)}</span>
                      <span>{tx.litres} L</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-4 text-base">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">{my.history.total}</span>
                    <span>{computation.totalTaken} L</span>
                  </div>
                  {computation.completedAt ? (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">{my.history.completed}</span>
                      <span>{formatAppDate(computation.completedAt)}</span>
                    </div>
                  ) : null}
                  {computation.nextEligibleAt ? (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">{my.history.nextEligible}</span>
                      <span>{formatAppDate(computation.nextEligibleAt)}</span>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      ))}
    </div>
  );
}
