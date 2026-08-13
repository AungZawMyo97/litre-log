import { getDaysInMonth } from "date-fns";
import type { PlateParity } from "@/lib/db";
import { getAppDayOfMonth, toAppDate } from "@/lib/timezone";

export function isOddDay(day: number): boolean {
  return day % 2 === 1;
}

export function isDrivingAllowedForParity(parity: PlateParity, date: Date, timezone?: string): boolean {
  const day = getAppDayOfMonth(date, timezone);
  const dayIsOdd = isOddDay(day);
  return parity === "ODD" ? dayIsOdd : !dayIsOdd;
}

export function getDrivingDaysInMonth(
  parity: PlateParity,
  year: number,
  month: number,
  timezone?: string,
): number[] {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const allowed: number[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (isDrivingAllowedForParity(parity, toAppDate(date, timezone), timezone)) {
      allowed.push(day);
    }
  }

  return allowed;
}

export type CalendarDayStatus = {
  date: Date;
  drivingAllowed: boolean;
  petrolRefillAvailable: boolean;
  petrolCycleIncomplete: boolean;
  petrolCycleCompleted: boolean;
};

export function buildCalendarDayStatus(
  parity: PlateParity,
  date: Date,
  options: {
    timezone?: string;
    petrolRefillAvailable?: boolean;
    petrolCycleIncomplete?: boolean;
    petrolCycleCompleted?: boolean;
  } = {},
): CalendarDayStatus {
  return {
    date,
    drivingAllowed: isDrivingAllowedForParity(parity, date, options.timezone),
    petrolRefillAvailable: options.petrolRefillAvailable ?? false,
    petrolCycleIncomplete: options.petrolCycleIncomplete ?? false,
    petrolCycleCompleted: options.petrolCycleCompleted ?? false,
  };
}
