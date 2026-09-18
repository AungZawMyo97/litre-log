import { formatInTimeZone } from "date-fns-tz";
import { addAppMonths, formatAppDateInput, getAppMonthDays, parseAppDateInput, startOfAppDay } from "@/lib/timezone";

export function getCalendarMonth(month: unknown, timezone: string, now = new Date()) {
  let anchor = now;
  if (typeof month === "string" && /^\d{4}-\d{2}$/.test(month)) {
    try {
      anchor = parseAppDateInput(`${month}-01`, timezone);
    } catch {
      // Invalid URL dates fall back to the current app-timezone month.
    }
  }
  return startOfAppDay(parseAppDateInput(`${formatAppDateInput(anchor, timezone).slice(0, 7)}-01`, timezone), timezone);
}

export function calendarMonthHref(anchor: Date, timezone: string, offset = 0) {
  const firstDay = getCalendarMonth(formatAppDateInput(anchor, timezone).slice(0, 7), timezone);
  return `/calendar?month=${formatAppDateInput(addAppMonths(firstDay, offset, timezone), timezone).slice(0, 7)}`;
}

export function getCalendarWeeks(anchor: Date, timezone: string): (Date | null)[][] {
  const days = getAppMonthDays(anchor, timezone);
  // ISO weekdays are Monday=1 through Sunday=7; the table starts on Sunday.
  const leadingDays = Number(formatInTimeZone(days[0], timezone, "i")) % 7;
  const cellCount = Math.ceil((leadingDays + days.length) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => days[index - leadingDays] ?? null);
  return Array.from({ length: cellCount / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}
