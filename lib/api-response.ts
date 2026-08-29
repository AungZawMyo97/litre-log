import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { my } from "@/lib/i18n/my";
import { PetrolCycleError } from "@/lib/services/petrol-cycle-service";

export function apiErrorResponse(error: unknown, fallback: string, fallbackStatus = 500) {
  if (error instanceof PetrolCycleError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }
  if (error instanceof ZodError || error instanceof SyntaxError || error instanceof RangeError) {
    return NextResponse.json({ error: my.errors.invalidRequest }, { status: 400 });
  }
  return NextResponse.json({ error: fallback }, { status: fallbackStatus });
}
