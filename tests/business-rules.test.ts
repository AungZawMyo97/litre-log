import { describe, expect, it } from "vitest";
import {
  computeCycleState,
  validateTransactionLitres,
  isEligibleForNewCycle,
  canUseCurrentAllocation,
} from "@/lib/services/petrol-cycle-logic";
import { parsePlateParity } from "@/lib/services/license-plate-service";
import {
  getDrivingDaysInMonth,
  isDrivingAllowedForParity,
} from "@/lib/services/vehicle-restriction-service";
import {
  addAppDays,
  formatAppDateInput,
  getAppDayOfMonth,
  getAppMonthDays,
  parseAppDateInput,
  startOfAppDay,
} from "@/lib/timezone";

const TZ = "Asia/Yangon";

function d(iso: string) {
  return new Date(`${iso}T12:00:00+06:30`);
}

describe("petrol cycle logic", () => {
  it("completes cycle on the transaction that reaches allocation (10 + 30)", () => {
    const result = computeCycleState(
      40,
      [
        { litres: 10, transactionAt: d("2026-08-11") },
        { litres: 30, transactionAt: d("2026-08-15") },
      ],
      7,
      TZ,
    );

    expect(result.totalTaken).toBe(40);
    expect(result.status).toBe("COMPLETED");
    expect(result.completedAt?.toISOString()).toBe(startOfAppDay(d("2026-08-15"), TZ).toISOString());
    expect(result.cycleStartedAt?.toISOString()).toBe(startOfAppDay(d("2026-08-11"), TZ).toISOString());
    expect(result.nextEligibleAt?.toISOString()).toBe(
      addAppDays(startOfAppDay(d("2026-08-11"), TZ), 7, TZ).toISOString(),
    );
  });

  it("completes cycle on 10 + 10 + 20 partial refills", () => {
    const result = computeCycleState(
      40,
      [
        { litres: 10, transactionAt: d("2026-08-11") },
        { litres: 10, transactionAt: d("2026-08-13") },
        { litres: 20, transactionAt: d("2026-08-15") },
      ],
      7,
      TZ,
    );

    expect(result.status).toBe("COMPLETED");
    expect(result.completedAt?.toISOString()).toBe(startOfAppDay(d("2026-08-15"), TZ).toISOString());
    expect(result.nextEligibleAt?.toISOString()).toBe(
      addAppDays(startOfAppDay(d("2026-08-11"), TZ), 7, TZ).toISOString(),
    );
  });

  it("keeps cycle open after partial refill until the first refill window expires", () => {
    const result = computeCycleState(40, [{ litres: 10, transactionAt: d("2026-08-11") }], 7, TZ);
    expect(result.status).toBe("OPEN");
    expect(result.remainingLitres).toBe(30);
    expect(result.nextEligibleAt?.toISOString()).toBe(
      addAppDays(startOfAppDay(d("2026-08-11"), TZ), 7, TZ).toISOString(),
    );
    expect(canUseCurrentAllocation(result, d("2026-08-17"), TZ)).toBe(true);
    expect(canUseCurrentAllocation(result, d("2026-08-18"), TZ)).toBe(false);
  });

  it("handles 39L taken with 1L remaining", () => {
    const result = computeCycleState(40, [{ litres: 39, transactionAt: d("2026-08-11") }], 7, TZ);
    expect(result.remainingLitres).toBe(1);
    expect(result.status).toBe("OPEN");
  });

  it("rejects over-allocation attempts", () => {
    expect(validateTransactionLitres(10, 5).valid).toBe(false);
    expect(validateTransactionLitres(5, 5).valid).toBe(true);
  });

  it("calculates next eligible from the first transaction in the cycle", () => {
    const completed = computeCycleState(
      40,
      [
        { litres: 10, transactionAt: d("2026-08-11") },
        { litres: 30, transactionAt: d("2026-08-15") },
      ],
      7,
      TZ,
    );

    expect(completed.nextEligibleAt?.toISOString()).toBe(
      addAppDays(startOfAppDay(d("2026-08-11"), TZ), 7, TZ).toISOString(),
    );
  });

  it("resets partial unused allocation one week after first withdrawal", () => {
    const partial = computeCycleState(40, [{ litres: 18, transactionAt: d("2026-08-10") }], 7, TZ);

    expect(partial.status).toBe("OPEN");
    expect(partial.remainingLitres).toBe(22);
    expect(partial.nextEligibleAt?.toISOString()).toBe(
      addAppDays(startOfAppDay(d("2026-08-10"), TZ), 7, TZ).toISOString(),
    );
    expect(isEligibleForNewCycle(partial, d("2026-08-17"), TZ)).toBe(true);
    expect(canUseCurrentAllocation(partial, d("2026-08-17"), TZ)).toBe(false);
  });

  it("marks eligible on next cycle date", () => {
    const completed = computeCycleState(40, [{ litres: 40, transactionAt: d("2026-08-11") }], 7, TZ);
    expect(isEligibleForNewCycle(completed, d("2026-08-18"), TZ)).toBe(true);
    expect(isEligibleForNewCycle(completed, d("2026-08-17"), TZ)).toBe(false);
    expect(canUseCurrentAllocation(completed, d("2026-08-18"), TZ)).toBe(false);
  });
});

describe("cycle date boundaries", () => {
  it("handles Feb 28 completion", () => {
    const result = computeCycleState(40, [{ litres: 40, transactionAt: d("2026-02-28") }], 7, TZ);
    expect(result.nextEligibleAt?.toISOString()).toBe(
      addAppDays(startOfAppDay(d("2026-02-28"), TZ), 7, TZ).toISOString(),
    );
  });

  it("handles Feb 29 leap year completion", () => {
    const result = computeCycleState(40, [{ litres: 40, transactionAt: d("2024-02-29") }], 7, TZ);
    expect(result.completedAt).not.toBeNull();
    expect(result.nextEligibleAt).not.toBeNull();
  });
});

describe("app date parsing", () => {
  it("parses date-only refill input at the configured app day", () => {
    const parsed = parseAppDateInput("2026-08-15", TZ);
    expect(startOfAppDay(parsed, TZ).toISOString()).toBe(startOfAppDay(d("2026-08-15"), TZ).toISOString());
  });

  it("formats date input from the app timezone instead of UTC", () => {
    const utcEveningBeforeMyanmarDay = new Date("2026-08-15T18:30:00.000Z");
    expect(formatAppDateInput(utcEveningBeforeMyanmarDay, TZ)).toBe("2026-08-16");
  });

  it("builds month days using app timezone calendar dates", () => {
    const days = getAppMonthDays(new Date("2026-08-31T20:00:00.000Z"), TZ);

    expect(days).toHaveLength(30);
    expect(getAppDayOfMonth(days[0], TZ)).toBe(1);
    expect(getAppDayOfMonth(days[days.length - 1], TZ)).toBe(30);
  });

  it("rejects impossible calendar dates", () => {
    expect(() => parseAppDateInput("2026-02-30", TZ)).toThrow(RangeError);
    expect(() => parseAppDateInput("2026-13-01", TZ)).toThrow(RangeError);
  });
});

describe("license plate parsing", () => {
  it("detects odd/even from the leading digit-letter series", () => {
    expect(parsePlateParity("1A")).toMatchObject({ confidence: "high", parity: "ODD" });
    expect(parsePlateParity("2A")).toMatchObject({ confidence: "high", parity: "EVEN" });
    expect(parsePlateParity("10A")).toMatchObject({ confidence: "high", parity: "EVEN" });
    expect(parsePlateParity("1B")).toMatchObject({ confidence: "high", parity: "ODD" });
    expect(parsePlateParity("9A-1234")).toMatchObject({ confidence: "high", parity: "ODD" });
  });

  it("falls back to trailing digits when no digit-letter series exists", () => {
    expect(parsePlateParity("ABC-1231")).toMatchObject({ confidence: "high", parity: "ODD" });
    expect(parsePlateParity("YGN 5679")).toMatchObject({ confidence: "high", parity: "ODD" });
  });

  it("normalizes Burmese digits", () => {
    expect(parsePlateParity("၂A-၁၂၃၄")).toMatchObject({ confidence: "high", parity: "EVEN" });
  });
});

describe("driving restrictions", () => {
  it("allows odd vehicles on odd calendar days", () => {
    expect(isDrivingAllowedForParity("ODD", d("2026-08-11"), TZ)).toBe(true);
    expect(isDrivingAllowedForParity("EVEN", d("2026-08-11"), TZ)).toBe(false);
  });

  it("respects month length for day 31", () => {
    const augustOddDays = getDrivingDaysInMonth("ODD", 2026, 8, TZ);
    expect(augustOddDays).toContain(31);

    const februaryOddDays = getDrivingDaysInMonth("ODD", 2026, 2, TZ);
    expect(februaryOddDays).not.toContain(31);
    expect(februaryOddDays).not.toContain(30);
  });

  it("keeps odd/even month calculations stable when the server runs in UTC", () => {
    const originalTimezone = process.env.TZ;
    process.env.TZ = "UTC";
    try {
      expect(getDrivingDaysInMonth("ODD", 2026, 8, TZ).slice(0, 4)).toEqual([1, 3, 5, 7]);
      expect(getDrivingDaysInMonth("EVEN", 2026, 8, TZ).slice(0, 4)).toEqual([2, 4, 6, 8]);
    } finally {
      process.env.TZ = originalTimezone;
    }
  });
});
