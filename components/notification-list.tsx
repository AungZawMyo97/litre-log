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
      <p className="rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] p-8 text-center text-[var(--muted)] shadow-[var(--shadow-card)]">
        {my.notifications.empty}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex min-h-11 items-center justify-end">
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => markRead({ all: true })}
            className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--card)] px-5 font-bold hover:bg-[var(--accent-soft)] disabled:opacity-60"
          >
            {my.notifications.markAllRead}
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="rounded-xl bg-[var(--bad-soft)] p-3 font-semibold text-[var(--bad)]">{error}</p> : null}
      {items.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-2xl border p-5 shadow-[var(--shadow-card)] sm:p-6 ${notification.read ? "border-[var(--line)] bg-[var(--surface)]" : "border-[var(--accent)]/35 bg-[var(--card)]"}`}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--hero)]">{notification.title}</h2>
              <p className="mt-2 text-base text-[var(--muted)]">{notification.message}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="text-sm text-[var(--muted)]">{notification.displayDate}</span>
              {!notification.read ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => markRead({ id: notification.id })}
                  className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-white px-4 font-bold hover:bg-[var(--accent-soft)] disabled:opacity-60"
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
