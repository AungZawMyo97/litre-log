import { my } from "@/lib/i18n/my";
import { formatAppDateInput, getAppDayOfMonth, getTodayHeading, isSameAppDay } from "@/lib/timezone";
import type { buildCalendarDayStatus } from "@/lib/services/vehicle-restriction-service";
import { getCalendarWeeks } from "./calendar-month";

type DayStatus = ReturnType<typeof buildCalendarDayStatus>;

export function MonthCalendar({ anchor, today, timezone, caption, days = [] }: {
  anchor: Date;
  today: Date;
  timezone: string;
  caption: string;
  days?: DayStatus[];
}) {
  const statuses = new Map(days.map((day) => [formatAppDateInput(day.date, timezone), day]));

  return (
    <table className="month-calendar">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {my.calendar.weekdays.map((weekday) => (
            <th key={weekday.full} scope="col">
              <abbr title={weekday.full} className="no-underline">{weekday.short}</abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {getCalendarWeeks(anchor, timezone).map((week, index) => (
          <tr key={index}>
            {week.map((date, column) => {
              if (!date) return <td key={`empty-${column}`} className="calendar-empty" />;
              const dateKey = formatAppDateInput(date, timezone);
              const status = statuses.get(dateKey);
              const isToday = isSameAppDay(date, today, timezone);
              const labels = [
                getTodayHeading(date, timezone),
                isToday ? my.calendar.today : "",
                status ? status.drivingAllowed ? my.calendar.drivingAllowed : my.calendar.drivingRestricted : "",
                status?.petrolRefillAvailable ? my.calendar.petrolAvailable : "",
                status?.petrolCycleIncomplete ? my.calendar.cycleIncomplete : "",
                status?.petrolCycleCompleted ? my.calendar.cycleCompleted : "",
              ].filter(Boolean).join(", ");

              return (
                <td key={dateKey} aria-current={isToday ? "date" : undefined} className={isToday ? "calendar-today" : undefined}>
                  <div className="calendar-day" aria-label={labels} title={labels}>
                    <time dateTime={dateKey} className="calendar-number">{getAppDayOfMonth(date, timezone)}</time>
                    <div className="calendar-markers" aria-hidden="true">
                      {status ? <span className={`calendar-driving ${status.drivingAllowed ? "is-allowed" : "is-restricted"}`}>{status.drivingAllowed ? "✓" : "−"}</span> : null}
                      {status?.petrolRefillAvailable ? <span className="calendar-fuel">●</span> : null}
                      {status?.petrolCycleIncomplete ? <span className="calendar-incomplete">○</span> : null}
                      {status?.petrolCycleCompleted ? <span className="calendar-completed">◆</span> : null}
                    </div>
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
