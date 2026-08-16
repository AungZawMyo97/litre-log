import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import {
  getVehiclePetrolSummary,
  getCurrentCycle,
  getCycleComputation,
  recordPetrolTransaction,
  PetrolCycleError,
} from "@/lib/services/petrol-cycle-service";
import { getAppTimezone } from "@/lib/settings";
import { parseAppDateInput } from "@/lib/timezone";

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
    if (error instanceof PetrolCycleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: my.errors.loadPetrolFailed }, { status: 500 });
  }
}

const transactionSchema = z.object({
  litres: z.number().positive(),
  transactionAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  station: z.string().optional(),
  receiptRef: z.string().optional(),
  notes: z.string().optional(),
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
    if (error instanceof PetrolCycleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : my.errors.recordTransactionFailed;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
