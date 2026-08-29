import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import {
  getVehiclePetrolSummary,
  getCurrentCycle,
  getCycleComputation,
  recordPetrolTransaction,
} from "@/lib/services/petrol-cycle-service";
import { getAppTimezone } from "@/lib/settings";
import { parseAppDateInput } from "@/lib/timezone";
import { apiErrorResponse } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const { id } = await context.params;

  try {
    const [summary, cycle] = await Promise.all([
      getVehiclePetrolSummary(id, user.id),
      getCurrentCycle(id, user.id),
    ]);

    const computation = cycle ? await getCycleComputation(cycle) : null;

    return NextResponse.json({ summary, cycle, computation });
  } catch (error) {
    return apiErrorResponse(error, my.errors.loadPetrolFailed);
  }
}

const transactionSchema = z.object({
  litres: z.number().positive(),
  transactionAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  station: z.string().max(120).optional(),
  receiptRef: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

    const { id } = await context.params;
    const body = transactionSchema.parse(await request.json());
    const timezone = await getAppTimezone();
    const transactionAt = body.transactionAt.includes("T")
      ? new Date(body.transactionAt)
      : parseAppDateInput(body.transactionAt, timezone);

    const cycle = await recordPetrolTransaction({
      vehicleId: id,
      userId: user.id,
      litres: body.litres,
      transactionAt,
      station: body.station,
      receiptRef: body.receiptRef,
      notes: body.notes,
    });

    const summary = await getVehiclePetrolSummary(id, user.id);
    return NextResponse.json({ cycle, summary }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, my.errors.recordTransactionFailed);
  }
}
