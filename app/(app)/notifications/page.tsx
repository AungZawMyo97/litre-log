import { getSessionUser } from "@/lib/auth";
import { listNotifications, syncDailyNotifications } from "@/lib/services/notification-service";
import { formatAppDateTime } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";
import { getAppTimezone } from "@/lib/settings";
import { NotificationList } from "@/components/notification-list";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  await syncDailyNotifications(user.id);
  const [notifications, timezone] = await Promise.all([
    listNotifications(user.id),
    getAppTimezone(),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold leading-relaxed text-[var(--hero)]">{my.notifications.title}</h1>
        <p className="mt-1 max-w-2xl text-[var(--muted)]">{my.notifications.desc}</p>
      </div>

      <NotificationList
        initialItems={notifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          displayDate: formatAppDateTime(notification.createdAt, timezone),
          read: notification.readAt !== null,
        }))}
      />
    </div>
  );
}
