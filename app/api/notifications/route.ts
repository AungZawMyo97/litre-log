import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notification-service";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-response";

const readSchema = z.union([
  z.object({ id: z.string().min(1) }),
  z.object({ all: z.literal(true) }),
]);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const notifications = await listNotifications(user.id);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  try {
    const body = readSchema.parse(await request.json());
    if ("all" in body) {
      await markAllNotificationsRead(user.id);
    } else {
      await markNotificationRead(user.id, body.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, my.errors.unexpected);
  }
}
