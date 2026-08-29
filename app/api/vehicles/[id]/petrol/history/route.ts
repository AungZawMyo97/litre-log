import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { my } from "@/lib/i18n/my";
import { getPetrolHistory } from "@/lib/services/petrol-cycle-service";
import { apiErrorResponse } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: my.errors.unauthorized }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    let history = await getPetrolHistory(id, user.id);

    if (status === "OPEN" || status === "COMPLETED" || status === "SUPERSEDED") {
      history = history.filter((item) => item.cycle.status === status);
    }

    return NextResponse.json({ history });
  } catch (error) {
    return apiErrorResponse(error, my.errors.loadHistoryFailed);
  }
}
