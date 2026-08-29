import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import { getAppTimezone } from "@/lib/settings";
import { PetrolCycleError } from "@/lib/services/petrol-cycle-service";
import { getVehicleCalendar } from "@/lib/services/vehicle-calendar-service";
import { addAppDays, getAppMonthDays, parseAppDateInput, startOfAppDay } from "@/lib/timezone";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const [{ id }, timezone] = await Promise.all([context.params, getAppTimezone()]);
  const month = new URL(request.url).searchParams.get("month");
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: my.errors.invalidRequest }, { status: 400 });
  }

  let anchor: Date;
  try {
    anchor = month ? parseAppDateInput(`${month}-01`, timezone) : new Date();
  } catch {
    return NextResponse.json({ error: my.errors.invalidRequest }, { status: 400 });
  }

  try {
    const calendar = await getVehicleCalendar(id, user.id, anchor);
    const monthDays = getAppMonthDays(anchor, timezone);
    const rangeStart = startOfAppDay(monthDays[0] ?? anchor, timezone);
    const rangeEnd = startOfAppDay(monthDays[monthDays.length - 1] ?? anchor, timezone);

    return NextResponse.json({
      vehicle: calendar.vehicle,
      summary: calendar.summary,
      days: calendar.days.map((day) => ({ ...day, date: day.date.toISOString() })),
      nextEligibleAt: calendar.summary.nextEligibleAt?.toISOString() ?? null,
      nextAllowedRefillAt: calendar.nextAllowedRefillAt?.toISOString() ?? null,
      monthStart: rangeStart.toISOString(),
      monthEnd: addAppDays(rangeEnd, 0, timezone).toISOString(),
    });
  } catch (error) {
    if (error instanceof PetrolCycleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: my.errors.loadCalendarFailed }, { status: 500 });
  }
}
