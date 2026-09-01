"use client";

import { useState, useTransition } from "react";
import { my } from "@/lib/i18n/my";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  displayDate: string;
  read: boolean;
};

export function NotificationList({ initialItems }: { initialItems: NotificationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const unreadCount = items.filter((item) => !item.read).length;

  function markRead(payload: { id: string } | { all: true }) {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("request failed");
        setItems((current) =>
          current.map((item) => ({
            ...item,
            read: "all" in payload || item.id === payload.id ? true : item.read,
          })),
        );
      } catch {
        setError(my.errors.unexpected);
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="empty-state text-[var(--muted)]">
        {my.notifications.empty}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex min-h-11 items-center justify-end">
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => markRead({ all: true })}
            className="button-secondary"
          >
            {my.notifications.markAllRead}
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="rounded-xl border border-[var(--bad)]/15 bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
      {items.map((notification) => (
        <article
          key={notification.id}
          className={`surface-panel relative overflow-hidden p-5 sm:p-6 ${notification.read ? "bg-[var(--card)]/62" : "bg-[var(--card)]"}`}
        >
          {!notification.read ? <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[var(--accent)]" /> : null}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                {!notification.read ? <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)]" /> : null}
                <h2 className="text-xl font-bold text-[var(--hero)]">{notification.title}</h2>
              </div>
              <p className="mt-2 max-w-3xl text-base text-[var(--muted)]">{notification.message}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="text-sm text-[var(--muted)]">{notification.displayDate}</span>
              {!notification.read ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => markRead({ id: notification.id })}
                  className="button-secondary"
                >
                  {my.notifications.markRead}
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
