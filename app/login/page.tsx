import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title={my.auth.welcomeBack}
      footer={
        <>
          {my.auth.noAccount}{" "}
          <Link href="/register" className="font-bold text-[var(--accent)] underline decoration-2 underline-offset-4">
            {my.auth.register}
          </Link>
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
