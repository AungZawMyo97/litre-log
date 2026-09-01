"use client";

import Link, { useLinkStatus } from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { my } from "@/lib/i18n/my";
import {
  BellIcon,
  CalendarIcon,
  HistoryIcon,
  HomeIcon,
  LogoutIcon,
  VehicleIcon,
} from "@/components/ui-icons";

const navItems = [
  { href: "/dashboard", label: my.nav.home, Icon: HomeIcon },
  { href: "/vehicles", label: my.nav.vehicles, Icon: VehicleIcon },
  { href: "/history", label: my.nav.history, Icon: HistoryIcon },
  { href: "/calendar", label: my.nav.calendar, Icon: CalendarIcon },
  { href: "/notifications", label: my.nav.alerts, Icon: BellIcon },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${compact ? "h-10 w-10" : "h-12 w-12"} relative shrink-0 overflow-hidden rounded-[0.9rem] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.14)]`}>
        <Image src="/icon-192x192.png" alt="" fill sizes={compact ? "40px" : "48px"} className="object-cover" priority />
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-lg font-bold tracking-[0.08em] text-white">LITRE LOG</span>
        <span className="mt-0.5 block truncate text-xs font-medium text-white/65">{my.brand.subtitle}</span>
      </span>
    </div>
  );
}

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
    <div className="min-h-dvh text-[var(--ink)] lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-[var(--nav)] px-5 py-6 text-white lg:flex">
        <div aria-hidden="true" className="absolute -left-28 -top-24 h-72 w-72 rounded-full border-[42px] border-white/[0.035]" />
        <div className="relative px-2">
          <BrandMark />
        </div>

        <nav aria-label="Main navigation" className="relative mt-10 flex-1 space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-14 items-center gap-3 rounded-xl border px-3.5 font-semibold ${
                  active
                    ? "border-white/10 bg-white text-[var(--nav)] shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
                    : "border-transparent text-white/74 hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-[var(--nav-soft)]" : "bg-white/[0.07]"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">{item.label}</span>
                <NavPendingDot />
              </Link>
            );
          })}
        </nav>

        <div className="relative rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
          {userName ? <p className="truncate text-sm font-semibold text-white/88">{userName}</p> : null}
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 text-sm font-bold text-white/82 hover:bg-white/[0.13] hover:text-white disabled:opacity-60"
          >
            <LogoutIcon className="h-5 w-5" />
            {busy ? my.common.pleaseWait : my.common.logout}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--nav)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shadow-[0_8px_24px_rgba(23,39,46,0.12)] lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <BrandMark compact />
            <button
              type="button"
              onClick={logout}
              disabled={busy}
              aria-label={busy ? my.common.pleaseWait : my.common.logout}
              className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-white/15 bg-white/[0.07] text-white/85 hover:bg-white/[0.14] disabled:opacity-60"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-7 sm:py-9 lg:px-10 lg:py-10 lg:pb-12 xl:px-12">
          {children}
        </main>
      </div>

      <nav className="mobile-bottom-nav z-50 border-t border-white/10 bg-[var(--nav)] text-white shadow-[0_-14px_36px_rgba(23,39,46,0.2)] lg:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 px-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[4.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[0.7rem] font-bold leading-tight min-[380px]:text-xs ${
                  active ? "bg-white text-[var(--nav)] shadow-lg" : "text-white/68 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon className="h-5.5 w-5.5" />
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
