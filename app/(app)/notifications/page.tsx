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
    <div className="page-shell space-y-8">
      <div className="page-heading">
        <p className="eyebrow">DAILY SIGNALS</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-relaxed text-[var(--hero)] sm:text-[2.15rem]">{my.notifications.title}</h1>
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
