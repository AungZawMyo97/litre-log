"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { my } from "@/lib/i18n/my";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login" ? { email, password } : { email, password, name: name || undefined };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? my.auth.genericError);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" ? (
        <label className="block space-y-2">
          <span className="font-semibold">{my.auth.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4"
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
          className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4"
        />
      </label>

      <label className="block space-y-2">
        <span className="font-semibold">{my.auth.password}</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4"
        />
      </label>

      {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="min-h-12 w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {loading ? my.common.pleaseWait : mode === "login" ? my.auth.signIn : my.auth.signUp}
      </button>
    </form>
  );
}
