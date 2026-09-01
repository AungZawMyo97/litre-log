import { and, asc, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getPetrolHistory } from "@/lib/services/petrol-cycle-service";
import { formatAppDate } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";
import { getAppTimezone } from "@/lib/settings";

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [userVehicles, timezone] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
      .orderBy(asc(vehicles.createdAt)),
    getAppTimezone(),
  ]);

  const histories = await Promise.all(
    userVehicles.map(async (vehicle) => ({
      vehicle,
      history: await getPetrolHistory(vehicle.id, user.id),
    })),
  );

  return (
    <div className="page-shell space-y-9">
      <div className="page-heading">
        <p className="eyebrow">CYCLE ARCHIVE</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)] sm:text-[2.15rem]">{my.history.title}</h1>
        <p className="mt-1 max-w-3xl text-[var(--muted)]">{my.history.desc}</p>
      </div>

      {histories.map(({ vehicle, history }) => (
        <section key={vehicle.id} className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line-strong)] pb-3">
            <h2 className="text-xl font-bold text-[var(--hero)]">{vehicle.name}</h2>
            <span className="eyebrow">{vehicle.licensePlate}</span>
          </div>
          {history.length === 0 ? (
            <p className="empty-state text-sm text-[var(--muted)]">{my.history.noCycles}</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {history.map(({ cycle, computation }) => (
              <article key={cycle.id} className="surface-panel p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">{my.history.cycle(cycle.cycleNumber)}</h3>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--surface-deep)] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                    {my.status[cycle.status]}
                  </span>
                </div>
                <ul className="divide-y divide-[var(--line)] text-base">
                  {cycle.transactions.map((tx) => (
                    <li key={tx.id} className="flex justify-between gap-4 py-2.5">
                      <span>{formatAppDate(tx.transactionAt, timezone)}</span>
                      <span className="font-bold tabular-nums">{tx.litres} L</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-2.5 rounded-xl bg-[var(--accent-soft)]/55 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">{my.history.total}</span>
                    <span className="font-bold tabular-nums">{computation.totalTaken} L</span>
                  </div>
                  {computation.completedAt ? (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">{my.history.completed}</span>
                      <span>{formatAppDate(computation.completedAt, timezone)}</span>
                    </div>
                  ) : null}
                  {computation.nextEligibleAt ? (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">{my.history.nextEligible}</span>
                      <span>{formatAppDate(computation.nextEligibleAt, timezone)}</span>
                    </div>
                  ) : null}
                </div>
              </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
