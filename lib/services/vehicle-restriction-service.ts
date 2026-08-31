import { getDaysInMonth } from "date-fns";
import type { PlateParity } from "@/lib/db";
import { addAppDays, getAppDayOfMonth, parseAppDateInput, startOfAppDay } from "@/lib/timezone";

function isOddDay(day: number): boolean {
  return day % 2 === 1;
}

export function isDrivingAllowedForParity(parity: PlateParity, date: Date, timezone?: string): boolean {
  const day = getAppDayOfMonth(date, timezone);
  const dayIsOdd = isOddDay(day);
  return parity === "ODD" ? dayIsOdd : !dayIsOdd;
}

export function getNextDrivingAllowedDay(from: Date, parity: PlateParity, timezone?: string): Date {
  let day = startOfAppDay(from, timezone);
  for (let i = 0; i < 7; i++) {
    if (isDrivingAllowedForParity(parity, day, timezone)) return day;
    day = addAppDays(day, 1, timezone);
  }
  return day;
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
    const date = parseAppDateInput(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      timezone,
    );
    if (isDrivingAllowedForParity(parity, date, timezone)) {
      allowed.push(day);
    }
  }

  return allowed;
}

type CalendarDayStatus = {
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
