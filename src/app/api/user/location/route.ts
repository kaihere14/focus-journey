import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/server/auth/current-user";
import { getOrCreateUser } from "@/server/services/user";
import { prisma } from "@/server/db/client";

const patchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().trim().min(1).max(255),
});

export async function GET() {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  return NextResponse.json({
    latitude: user.currentLatitude,
    longitude: user.currentLongitude,
    locationName: user.currentLocationName,
  });
}

// Establishes the user's initial FocusJourney location from the browser's
// geolocation. Once set, only completing a journey may move it — this
// route refuses to overwrite an already-known location.
export async function PATCH(request: NextRequest) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  if (user.currentLatitude !== null && user.currentLongitude !== null) {
    return NextResponse.json({
      latitude: user.currentLatitude,
      longitude: user.currentLongitude,
      locationName: user.currentLocationName,
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      currentLatitude: parsed.data.latitude,
      currentLongitude: parsed.data.longitude,
      currentLocationName: parsed.data.locationName,
    },
  });

  return NextResponse.json({
    latitude: updated.currentLatitude,
    longitude: updated.currentLongitude,
    locationName: updated.currentLocationName,
  });
}
