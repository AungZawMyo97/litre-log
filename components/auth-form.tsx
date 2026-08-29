"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { my } from "@/lib/i18n/my";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = loading || isPending;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login" ? { email, password } : { email, password, name: name || undefined };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? my.auth.genericError);
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch {
      setError(my.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="font-semibold">{my.auth.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="min-h-14 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg shadow-sm disabled:bg-[var(--surface)] disabled:opacity-75"
            placeholder={my.auth.optional}
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="font-semibold">{my.auth.email}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="min-h-14 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg shadow-sm disabled:bg-[var(--surface)] disabled:opacity-75"
        />
      </label>

      <label className="block space-y-2">
        <span className="font-semibold">{my.auth.password}</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          className="min-h-14 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg shadow-sm disabled:bg-[var(--surface)] disabled:opacity-75"
        />
      </label>

      {error ? <p role="alert" className="rounded-xl bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="min-h-14 w-full rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-white shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {busy ? my.common.pleaseWait : mode === "login" ? my.auth.signIn : my.auth.signUp}
      </button>
    </form>
  );
}
