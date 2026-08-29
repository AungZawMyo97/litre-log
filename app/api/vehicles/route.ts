import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, vehicles, type PlateParity } from "@/lib/db";
import { my } from "@/lib/i18n/my";

import { getSessionUser } from "@/lib/auth";
import { parsePlateParity } from "@/lib/services/license-plate-service";
import { apiErrorResponse } from "@/lib/api-response";

const vehicleSchema = z.object({
  name: z.string().min(1).max(100),
  licensePlate: z.string().min(1).max(50),
  plateParity: z.enum(["ODD", "EVEN"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, user.id), eq(vehicles.isActive, true)))
    .orderBy(asc(vehicles.createdAt));

  return NextResponse.json({ vehicles: rows });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  try {
    const body = vehicleSchema.parse(await request.json());
    const parsed = parsePlateParity(body.licensePlate);

    let plateParity: PlateParity;
    let paritySource = "auto";

    if (body.plateParity) {
      plateParity = body.plateParity;
      paritySource = parsed.confidence === "high" && parsed.parity === body.plateParity ? "auto" : "manual";
    } else if (parsed.confidence === "high") {
      plateParity = parsed.parity;
    } else {
      return NextResponse.json(
        {
          error: my.errors.plateParityRequired,
          suggestedParity: parsed.suggestedParity,
        },
        { status: 422 },
      );
    }

    const [vehicle] = await db
      .insert(vehicles)
      .values({
        userId: user.id,
        name: body.name.trim(),
        licensePlate: body.licensePlate.trim(),
        plateParity,
        paritySource,
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, my.errors.invalidVehicleData);
  }
}
