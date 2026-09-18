import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/server/auth/current-user";
import { getOrCreateUser } from "@/server/services/user";
import { getAnalytics, type AnalyticsRange } from "@/server/services/analytics";

const RANGES: [AnalyticsRange, ...AnalyticsRange[]] = [
  "daily",
  "weekly",
  "monthly",
  "all",
];

const querySchema = z.object({
  range: z.enum(RANGES).default("daily"),
  tz: z.string().trim().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    range: searchParams.get("range") ?? undefined,
    tz: searchParams.get("tz") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const analytics = await getAnalytics(
    user.id,
    parsed.data.range,
    parsed.data.tz ?? "UTC",
  );

  return NextResponse.json(analytics);
}
