import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const APP_TIMEZONE = "Asia/Yangon";

export function toAppDate(date: Date, timezone = APP_TIMEZONE): Date {
  return toZonedTime(date, timezone);
}

export function startOfAppDay(date: Date, timezone = APP_TIMEZONE): Date {
  const zoned = toZonedTime(date, timezone);
  zoned.setHours(0, 0, 0, 0);
  return fromZonedTime(zoned, timezone);
}

export function addAppDays(date: Date, days: number, timezone = APP_TIMEZONE): Date {
  const zoned = toZonedTime(date, timezone);
  zoned.setDate(zoned.getDate() + days);
  zoned.setHours(0, 0, 0, 0);
  return fromZonedTime(zoned, timezone);
}

export function formatAppDate(date: Date, timezone = APP_TIMEZONE): string {
  return formatInTimeZone(date, timezone, "d MMM yyyy");
}

export function formatAppDateTime(date: Date, timezone = APP_TIMEZONE): string {
  return formatInTimeZone(date, timezone, "d MMM yyyy HH:mm");
}

export function formatAppMonthYear(date: Date, timezone = APP_TIMEZONE): string {
  return formatInTimeZone(date, timezone, "MMMM yyyy");
}

export function getTodayHeading(date = new Date(), timezone = APP_TIMEZONE): string {
  return formatInTimeZone(date, timezone, "EEEE, d MMMM yyyy");
}

export function getAppDayOfMonth(date: Date, timezone = APP_TIMEZONE): number {
  return toZonedTime(date, timezone).getDate();
}

export function isSameAppDay(a: Date, b: Date, timezone = APP_TIMEZONE): boolean {
  return formatInTimeZone(a, timezone, "yyyy-MM-dd") === formatInTimeZone(b, timezone, "yyyy-MM-dd");
}

export function parseAppDateInput(value: string, timezone = APP_TIMEZONE): Date {
  const [year, month, day] = value.split("-").map(Number);
  const local = new Date(year, month - 1, day, 12, 0, 0, 0);
  return fromZonedTime(local, timezone);
}
