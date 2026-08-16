function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--skeleton)] ${className}`} />;
}

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_14px_34px_rgba(28,37,32,0.06)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-5 w-32" />
        </div>
        <SkeletonLine className="h-9 w-28" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonLine key={index} className={index === 1 ? "h-4 w-full rounded-full" : "h-5 w-full max-w-[32rem]"} />
        ))}
      </div>
    </article>
  );
}

function PageHeadingSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonLine className="h-8 w-44" />
      <SkeletonLine className="h-5 w-full max-w-md" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <section className="rounded-lg bg-[var(--hero)] px-5 py-6 shadow-[0_18px_42px_rgba(23,63,53,0.16)]">
        <SkeletonLine className="h-4 w-20 bg-white/25" />
        <SkeletonLine className="mt-3 h-8 w-full max-w-sm bg-white/30" />
        <SkeletonLine className="mt-4 h-5 w-full max-w-2xl bg-white/20" />
      </section>
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function VehiclesSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading vehicles">
      <PageHeadingSkeleton />
      <CardSkeleton rows={5} />
      <div className="space-y-3">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading history">
      <PageHeadingSkeleton />
      <section className="space-y-3">
        <SkeletonLine className="h-7 w-56" />
        <CardSkeleton rows={6} />
        <CardSkeleton rows={5} />
      </section>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading calendar">
      <PageHeadingSkeleton />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonLine key={index} className="h-10" />
        ))}
      </div>
      <section className="space-y-3">
        <SkeletonLine className="h-7 w-52" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <SkeletonLine key={index} className="min-h-11" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading notifications">
      <PageHeadingSkeleton />
      <div className="space-y-3">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
      </div>
    </div>
  );
}
