import { NextResponse } from "next/server";
import { getAuthUserId } from "@/server/auth/current-user";
import { getOrCreateUser } from "@/server/services/user";
import { getActiveTravelHistoryForUser } from "@/server/services/travel-history";

export async function GET() {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const travelHistory = await getActiveTravelHistoryForUser(user.id);
  return NextResponse.json({ travelHistory });
}
