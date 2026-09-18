import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/server/auth/current-user";
import { getOrCreateUser } from "@/server/services/user";
import {
  createTravelHistory,
  listTravelHistoryForUser,
  vehicleKeyToEnum,
} from "@/server/services/travel-history";
import type { VehicleKey } from "@/config/vehicles";

const VEHICLE_KEYS: [VehicleKey, ...VehicleKey[]] = [
  "car",
  "motorcycle",
  "bicycle",
  "walking",
];

const createSchema = z.object({
  fromLatitude: z.number().min(-90).max(90),
  fromLongitude: z.number().min(-180).max(180),
  fromLocationName: z.string().trim().min(1).max(255),
  toLatitude: z.number().min(-90).max(90),
  toLongitude: z.number().min(-180).max(180),
  toLocationName: z.string().trim().min(1).max(255),
  vehicle: z.enum(VEHICLE_KEYS),
  distance: z.number().positive(),
  startedAt: z.iso.datetime().optional(),
});

export async function POST(request: NextRequest) {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();

  const travelHistory = await createTravelHistory({
    userId: user.id,
    fromLatitude: data.fromLatitude,
    fromLongitude: data.fromLongitude,
    fromLocationName: data.fromLocationName,
    toLatitude: data.toLatitude,
    toLongitude: data.toLongitude,
    toLocationName: data.toLocationName,
    vehicle: vehicleKeyToEnum(data.vehicle),
    distance: data.distance,
    startedAt,
  });

  return NextResponse.json(
    { id: travelHistory.id, startedAt: travelHistory.startedAt },
    { status: 201 },
  );
}

export async function GET() {
  if (!(await getAuthUserId())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();

  const history = await listTravelHistoryForUser(user.id);
  return NextResponse.json({ travelHistory: history });
}
