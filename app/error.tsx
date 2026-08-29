"use client";

import { useEffect } from "react";
import { my } from "@/lib/i18n/my";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4">
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow-card)]">
        <h1 className="font-display text-2xl font-bold text-[var(--hero)]">{my.errors.unexpected}</h1>
        <button type="button" onClick={retry} className="mt-6 min-h-12 rounded-xl bg-[var(--accent)] px-6 font-bold text-white hover:bg-[var(--accent-hover)]">
          {my.common.retry}
        </button>
      </div>
    </main>
  );
}
