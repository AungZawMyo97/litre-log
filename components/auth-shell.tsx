import type { ReactNode } from "react";
import Image from "next/image";
import { my } from "@/lib/i18n/my";

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div aria-hidden="true" className="absolute -right-36 -top-40 h-[30rem] w-[30rem] rounded-full border-[70px] border-[var(--accent)]/[0.045]" />
      <div className="page-shell relative grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-lift)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden min-h-[38rem] overflow-hidden bg-[var(--nav)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden="true" className="absolute -left-28 -top-28 h-80 w-80 rounded-full border-[48px] border-white/[0.04]" />
          <div className="relative">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-xl">
              <Image src="/icon-192x192.png" alt="" fill sizes="64px" className="object-cover" priority />
            </div>
            <p className="mt-7 font-serif text-2xl font-bold tracking-[0.12em]">LITRE LOG</p>
            <p className="mt-3 max-w-xs text-lg leading-8 text-white/70">{my.brand.subtitle}</p>
          </div>
          <div className="relative">
            <div className="mb-4 flex items-end gap-2" aria-hidden="true">
              {[28, 46, 64, 82, 100].map((height) => (
                <span key={height} className="w-2 rounded-full bg-white/25" style={{ height: `${height}px` }} />
              ))}
            </div>
            <p className="text-sm font-medium leading-7 text-white/55">PETROL CYCLE · DRIVING DAYS · ONE CLEAR VIEW</p>
          </div>
        </aside>

        <section className="px-5 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-14">
          <div className="mb-8">
            <p className="eyebrow lg:hidden">LITRE LOG</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)] sm:text-[2.15rem]">{title}</h1>
            <div aria-hidden="true" className="mt-4 h-1 w-12 rounded-full bg-[var(--accent)]" />
          </div>
          {children}
          <div className="mt-7 border-t border-[var(--line)] pt-5 text-base text-[var(--muted)]">{footer}</div>
        </section>
      </div>
    </main>
  );
}
