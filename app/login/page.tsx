import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-(--hero)">
          {my.brand.title}
        </p>
        <h1 className="font-display text-3xl font-bold leading-snug">
          {my.auth.welcomeBack}
        </h1>
      </div>
      <AuthForm mode="login" />
      <p className="mt-5 text-base text-(--muted)">
        {my.auth.noAccount}{" "}
        <Link href="/register" className="font-bold text-(--accent) underline">
          {my.auth.register}
        </Link>
      </p>
    </div>
  );
}
