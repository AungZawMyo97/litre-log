import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title={my.auth.createAccount}
      footer={
        <>
          {my.auth.alreadyRegistered}{" "}
          <Link href="/login" className="font-bold text-[var(--accent)] underline decoration-2 underline-offset-4">
            {my.auth.signIn}
          </Link>
        </>
      }
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
