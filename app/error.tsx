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
      <div className="surface-panel w-full p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--hero)]">{my.errors.unexpected}</h1>
        <button type="button" onClick={retry} className="button-primary mt-6">
          {my.common.retry}
        </button>
      </div>
    </main>
  );
}
