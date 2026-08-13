import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import { listNotifications, markNotificationRead } from "@/lib/services/notification-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const notifications = await listNotifications(user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: my.errors.notificationIdRequired }, { status: 400 });
  }

  await markNotificationRead(user.id, body.id);
  return NextResponse.json({ ok: true });
}
