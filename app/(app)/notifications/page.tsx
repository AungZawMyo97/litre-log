import { getSessionUser } from "@/lib/auth";
import { listNotifications } from "@/lib/services/notification-service";
import { formatAppDateTime } from "@/lib/timezone";
import { my } from "@/lib/i18n/my";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const notifications = await listNotifications(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{my.notifications.title}</h1>
        <p className="mt-1 text-base text-[var(--muted)]">{my.notifications.desc}</p>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--card)] p-6 text-[var(--muted)]">
          {my.notifications.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-lg border border-[var(--line)] p-5 ${
                notification.readAt ? "opacity-70" : "bg-[var(--card)]"
              }`}
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                <div>
                  <h2 className="text-lg font-bold">{notification.title}</h2>
                  <p className="mt-1 text-base text-[var(--muted)]">{notification.message}</p>
                </div>
                <span className="text-sm text-[var(--muted)]">
                  {formatAppDateTime(notification.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
