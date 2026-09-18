import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/server/auth/current-user";
import { getOrCreateUser } from "@/server/services/user";
import {
  deleteTravelHistoryForUser,
  finalizeTravelHistory,
  getTravelHistoryForUser,
  TravelHistoryAlreadyFinalizedError,
  TravelHistoryNotFoundError,
} from "@/server/services/travel-history";

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  durationSeconds: z.number().nonnegative(),
  completed: z.boolean(),
});

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const { id } = await params;
  const travelHistory = await getTravelHistoryForUser(id, user.id);
  if (!travelHistory) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ travelHistory });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const travelHistory = await finalizeTravelHistory({
      id,
      userId: user.id,
      durationSeconds: parsed.data.durationSeconds,
      completed: parsed.data.completed,
    });
    return NextResponse.json({ travelHistory });
  } catch (error) {
    if (error instanceof TravelHistoryNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof TravelHistoryAlreadyFinalizedError) {
      return NextResponse.json(
        { error: "Journey already finalized" },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const { id } = await params;
  const deleted = await deleteTravelHistoryForUser(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
