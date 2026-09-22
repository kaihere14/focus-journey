import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/server/auth/current-user";
import { getOrCreateUser } from "@/server/services/user";
import { checkpointTravelHistory } from "@/server/services/travel-history";

type RouteParams = { params: Promise<{ id: string }> };

const checkpointSchema = z.object({
  elapsedActiveMs: z.number().nonnegative(),
});

// Fire-and-forget progress save: periodic while a journey is ACTIVE, and
// on pagehide via sendBeacon (which can only POST). Never throws on a
// finalized/missing row — checkpointTravelHistory's ACTIVE guard just
// no-ops, which is correct for a beacon that lands after finalize.
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = checkpointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await checkpointTravelHistory({
    id,
    userId: user.id,
    elapsedActiveMs: parsed.data.elapsedActiveMs,
  });

  return new NextResponse(null, { status: 204 });
}
