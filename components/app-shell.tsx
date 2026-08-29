"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { my } from "@/lib/i18n/my";
import { BellIcon, CalendarIcon, HistoryIcon, HomeIcon, VehicleIcon } from "@/components/ui-icons";

const navItems = [
  { href: "/dashboard", label: my.nav.home, Icon: HomeIcon },
  { href: "/vehicles", label: my.nav.vehicles, Icon: VehicleIcon },
  { href: "/history", label: my.nav.history, Icon: HistoryIcon },
  { href: "/calendar", label: my.nav.calendar, Icon: CalendarIcon },
  { href: "/notifications", label: my.nav.alerts, Icon: BellIcon },
];

function NavPendingDot() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 rounded-full bg-current transition-opacity ${pending ? "animate-pulse opacity-70" : "opacity-0"}`}
    />
  );
}

export function AppShell({ children, userName }: { children: React.ReactNode; userName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = logoutLoading || isPending;

  async function logout() {
    setLogoutLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="min-h-dvh bg-[var(--surface)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/95 shadow-[0_1px_8px_rgba(20,42,63,0.04)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">{my.brand.title}</p>
            <p className="font-display text-base font-semibold leading-snug text-[var(--ink)] sm:text-lg">{my.brand.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {userName ? <span className="hidden text-sm text-[var(--muted)] sm:inline">{userName}</span> : null}
            <button
              type="button"
              onClick={logout}
              disabled={busy}
              className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-white px-4 text-base font-bold hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-60"
            >
              {busy ? my.common.pleaseWait : my.common.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-[calc(8.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
        {children}
      </main>

      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 w-full bg-[var(--nav)] text-white shadow-[0_-16px_34px_rgba(15,39,68,0.22)] sm:bg-[var(--surface)]/95 sm:text-[var(--ink)] sm:backdrop-blur-md">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 px-2 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:py-2.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[0.72rem] font-bold leading-tight min-[380px]:text-xs sm:min-h-[4.25rem] sm:text-sm ${
                  active
                    ? "bg-white text-[var(--nav)] shadow-[0_8px_20px_rgba(0,0,0,0.18)] sm:bg-[var(--accent-soft)] sm:text-[var(--hero)] sm:shadow-inner"
                    : "text-white/82 hover:bg-white/10 sm:text-[var(--muted)] sm:hover:bg-[var(--card)]"
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${
                    active ? "bg-[var(--nav-soft)] text-[var(--nav)] sm:bg-transparent" : "bg-white/12 text-white sm:bg-transparent sm:text-current"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
                <NavPendingDot />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
