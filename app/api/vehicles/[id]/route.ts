import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, vehicles } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import { parsePlateParity } from "@/lib/services/license-plate-service";
import { apiErrorResponse } from "@/lib/api-response";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  licensePlate: z.string().min(1).max(50).optional(),
  plateParity: z.enum(["ODD", "EVEN"]).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedVehicle(id: string, userId: string) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)))
    .limit(1);
  return vehicle ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const { id } = await context.params;
  const vehicle = await getOwnedVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: my.errors.notFound }, { status: 404 });

  return NextResponse.json({ vehicle });
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const { id } = await context.params;
  const vehicle = await getOwnedVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: my.errors.notFound }, { status: 404 });

  try {
    const body = updateSchema.parse(await request.json());
    let plateParity = body.plateParity ?? vehicle.plateParity;
    let paritySource = vehicle.paritySource;

    if (body.licensePlate) {
      const parsed = parsePlateParity(body.licensePlate);
      if (body.plateParity) {
        plateParity = body.plateParity;
        paritySource = "manual";
      } else if (parsed.confidence === "high") {
        plateParity = parsed.parity;
        paritySource = "auto";
      }
    } else if (body.plateParity) {
      plateParity = body.plateParity;
      paritySource = "manual";
    }

    const [updated] = await db
      .update(vehicles)
      .set({
        name: body.name?.trim() ?? vehicle.name,
        licensePlate: body.licensePlate?.trim() ?? vehicle.licensePlate,
        plateParity,
        paritySource,
        isActive: body.isActive ?? vehicle.isActive,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();

    return NextResponse.json({ vehicle: updated });
  } catch (error) {
    return apiErrorResponse(error, my.errors.invalidVehicleData);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const { id } = await context.params;
  const vehicle = await getOwnedVehicle(id, user.id);
  if (!vehicle) return NextResponse.json({ error: my.errors.notFound }, { status: 404 });

  const [updated] = await db
    .update(vehicles)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(vehicles.id, id))
    .returning();

  return NextResponse.json({ vehicle: updated });
}
