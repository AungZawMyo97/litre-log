import Link from "next/link";
import { my } from "@/lib/i18n/my";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4">
      <div className="surface-panel w-full p-8 text-center">
        <p className="text-sm font-extrabold tracking-widest text-[var(--muted)]">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[var(--hero)]">{my.errors.pageNotFound}</h1>
        <Link href="/" className="button-primary mt-6">
          {my.nav.home}
        </Link>
      </div>
    </main>
  );
}
