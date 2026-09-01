"use client";

import { my } from "@/lib/i18n/my";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="my">
      <body>
        <main className="grid min-h-dvh place-items-center bg-[#f4f5f1] px-4 text-[#17272e]">
          <div className="w-full max-w-lg rounded-2xl border border-[#d8ded8] bg-[#fffefa] p-8 text-center shadow-[0_12px_36px_rgba(23,39,46,0.08)]">
            <h1 className="text-2xl font-bold">{my.errors.unexpected}</h1>
            <button type="button" onClick={retry} className="mt-6 min-h-12 rounded-xl bg-[#3d6682] px-6 font-bold text-white">
              {my.common.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
