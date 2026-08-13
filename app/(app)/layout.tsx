import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell userName={user.name ?? user.email}>{children}</AppShell>;
}
