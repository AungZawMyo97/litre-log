"use client";

import { my } from "@/lib/i18n/my";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="my">
      <body>
        <main className="grid min-h-dvh place-items-center bg-white px-4 text-[#16283a]">
          <div className="w-full max-w-lg rounded-lg border border-[#d8e4f0] p-6 text-center">
            <h1 className="text-2xl font-bold">{my.errors.unexpected}</h1>
            <button type="button" onClick={retry} className="mt-5 min-h-11 rounded-lg bg-[#315f93] px-5 font-bold text-white">
              {my.common.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
