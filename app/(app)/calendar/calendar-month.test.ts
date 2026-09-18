import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatAppDateInput, parseAppDateInput } from "@/lib/timezone";
import { buildCalendarDayStatus } from "@/lib/services/vehicle-restriction-service";
import { my } from "@/lib/i18n/my";
import { calendarMonthHref, getCalendarMonth, getCalendarWeeks } from "./calendar-month";
import { MonthCalendar } from "./month-calendar";

const TZ = "Asia/Yangon";
const now = new Date("2026-09-18T00:00:00+06:30");

describe("calendar month layout", () => {
  it.each([
    ["2026-09", 2, 30, 5], // Tuesday start
    ["2026-08", 6, 31, 6], // Saturday start, six rows
    ["2026-02", 0, 28, 4], // Sunday start
    ["2024-02", 4, 29, 5], // Leap year
    ["2100-02", 1, 28, 5], // Century that is not a leap year
  ])("aligns %s with the correct weekdays", (month, offset, count, rows) => {
    const weeks = getCalendarWeeks(getCalendarMonth(month, TZ, now), TZ);
    const cells = weeks.flat();
    expect(weeks).toHaveLength(rows);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(cells.slice(0, offset)).toEqual(Array(offset).fill(null));
    const dates = cells.filter((date): date is Date => date !== null);
    expect(dates.map((date) => formatAppDateInput(date, TZ))).toEqual(
      Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`),
    );
    expect(formatAppDateInput(cells[offset]!, TZ)).toBe(`${month}-01`);
    expect(cells.slice(offset + count).every((date) => date === null)).toBe(true);
  });

  it.each([undefined, "bad", "2026-00", "2026-13", "2026-02-30", ["2026-01", "2026-02"]])(
    "falls back safely for invalid month %j", (month) => {
      expect(formatAppDateInput(getCalendarMonth(month, TZ, now), TZ)).toBe("2026-09-01");
    },
  );

  it("uses the app date when UTC is still in the previous month", () => {
    const boundary = new Date("2026-08-31T18:00:00Z");
    expect(formatAppDateInput(getCalendarMonth(undefined, TZ, boundary), TZ)).toBe("2026-09-01");
    const zone = "America/Los_Angeles";
    expect(formatAppDateInput(getCalendarMonth(undefined, zone, boundary), zone)).toBe("2026-08-01");
  });

  it("navigates across short months and years from the first day", () => {
    const endOfJanuary = parseAppDateInput("2026-01-31", TZ);
    expect(calendarMonthHref(endOfJanuary, TZ, 1)).toBe("/calendar?month=2026-02");
    expect(calendarMonthHref(endOfJanuary, TZ, -1)).toBe("/calendar?month=2025-12");
    expect(calendarMonthHref(parseAppDateInput("2026-12-31", TZ), TZ, 1)).toBe("/calendar?month=2027-01");
  });

  it("keeps dates aligned through daylight-saving changes", () => {
    const zone = "America/New_York";
    const weeks = getCalendarWeeks(getCalendarMonth("2026-03", zone), zone);
    const dates = weeks.flat().filter((date): date is Date => date !== null);
    expect(dates.map((date) => formatAppDateInput(date, zone))).toEqual(
      Array.from({ length: 31 }, (_, index) => `2026-03-${String(index + 1).padStart(2, "0")}`),
    );
    expect(formatAppDateInput(weeks[1][0]!, zone)).toBe("2026-03-08");
  });
});

describe("visible calendar dates", () => {
  it("renders all weekdays and dates, and marks today even without vehicles", () => {
    const html = renderToStaticMarkup(createElement(MonthCalendar, {
      anchor: getCalendarMonth("2026-09", TZ), today: new Date("2026-09-17T18:00:00Z"),
      timezone: TZ, caption: "September 2026",
    }));
    expect(html.match(/scope="col"/g)).toHaveLength(7);
    expect(html.match(/dateTime="2026-09-/g)).toHaveLength(30);
    expect(html.match(/aria-current="date"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="date"[^]*?dateTime="2026-09-18"/);
    expect(html).toContain("Friday, 18 September 2026");
    expect(html).not.toContain("is-allowed");
  });

  it("preserves concurrent status labels", () => {
    const date = parseAppDateInput("2026-09-18", TZ);
    const html = renderToStaticMarkup(createElement(MonthCalendar, {
      anchor: getCalendarMonth("2026-09", TZ), today: now, timezone: TZ, caption: "Vehicle",
      days: [buildCalendarDayStatus("EVEN", date, {
        timezone: TZ, petrolRefillAvailable: true, petrolCycleIncomplete: true, petrolCycleCompleted: true,
      })],
    }));
    expect(html).toContain(my.calendar.drivingAllowed);
    expect(html).toContain(my.calendar.petrolAvailable);
    expect(html).toContain(my.calendar.cycleIncomplete);
    expect(html).toContain(my.calendar.cycleCompleted);
  });

  it("does not mark today in another month", () => {
    const html = renderToStaticMarkup(createElement(MonthCalendar, {
      anchor: getCalendarMonth("2026-08", TZ), today: now, timezone: TZ, caption: "August 2026",
    }));
    expect(html).not.toContain('aria-current="date"');
  });
});
