import Link from "next/link";
import { my } from "@/lib/i18n/my";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4">
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-extrabold tracking-widest text-[var(--muted)]">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[var(--hero)]">{my.errors.pageNotFound}</h1>
        <Link href="/" className="mt-6 inline-grid min-h-12 place-items-center rounded-xl bg-[var(--accent)] px-6 font-bold text-white hover:bg-[var(--accent-hover)]">
          {my.nav.home}
        </Link>
      </div>
    </main>
  );
}
