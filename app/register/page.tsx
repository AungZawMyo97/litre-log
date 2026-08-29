import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="mb-7">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">{my.brand.title}</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)]">{my.auth.createAccount}</h1>
      </div>
      <AuthForm mode="register" />
      <p className="mt-6 border-t border-[var(--line)] pt-5 text-base text-[var(--muted)]">
        {my.auth.alreadyRegistered}{" "}
        <Link href="/login" className="font-bold text-[var(--accent)] underline decoration-2 underline-offset-4">
          {my.auth.signIn}
        </Link>
      </p>
      </section>
    </main>
  );
}
