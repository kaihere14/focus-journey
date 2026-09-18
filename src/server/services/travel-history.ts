import { prisma } from "@/server/db/client";
import type { Vehicle, TravelHistory } from "@/generated/prisma/client";
import type { VehicleKey } from "@/config/vehicles";

const VEHICLE_KEY_TO_ENUM: Record<VehicleKey, Vehicle> = {
  car: "CAR",
  motorcycle: "MOTORCYCLE",
  bicycle: "BICYCLE",
  walking: "WALKING",
};

export function vehicleKeyToEnum(key: VehicleKey): Vehicle {
  return VEHICLE_KEY_TO_ENUM[key];
}

export class TravelHistoryNotFoundError extends Error {}
export class TravelHistoryAlreadyFinalizedError extends Error {}

export type CreateTravelHistoryInput = {
  userId: string;
  fromLatitude: number;
  fromLongitude: number;
  fromLocationName: string;
  toLatitude: number;
  toLongitude: number;
  toLocationName: string;
  vehicle: Vehicle;
  distance: number;
  startedAt: Date;
};

export function createTravelHistory(
  input: CreateTravelHistoryInput,
): Promise<TravelHistory> {
  return prisma.travelHistory.create({
    data: {
      ...input,
      // Required by the schema; the record is "active" until this diverges
      // from startedAt (see the duration:0 sentinel below).
      completedAt: input.startedAt,
      duration: 0,
    },
  });
}

export function listTravelHistoryForUser(
  userId: string,
): Promise<TravelHistory[]> {
  return prisma.travelHistory.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
}

export function getTravelHistoryForUser(
  id: string,
  userId: string,
): Promise<TravelHistory | null> {
  return prisma.travelHistory.findFirst({ where: { id, userId } });
}

export async function deleteTravelHistoryForUser(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.travelHistory.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

/**
 * Marks a journey as finished, either because it completed or because the
 * user exited early. `duration: 0` is the sentinel for "still active" (set
 * at creation), so a real finalization always clamps to at least 1 second
 * to keep that sentinel unambiguous, and the update itself is guarded by
 * `duration: 0` in its `where` clause so two concurrent requests can't both
 * finalize the same record.
 */
export async function finalizeTravelHistory({
  id,
  userId,
  durationSeconds,
  completed,
}: {
  id: string;
  userId: string;
  durationSeconds: number;
  completed: boolean;
}): Promise<TravelHistory> {
  const existing = await prisma.travelHistory.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new TravelHistoryNotFoundError();
  }
  if (existing.duration !== 0) {
    throw new TravelHistoryAlreadyFinalizedError();
  }

  const completedAt = new Date();
  const duration = Math.max(1, Math.round(durationSeconds));

  if (!completed) {
    const result = await prisma.travelHistory.updateMany({
      where: { id, userId, duration: 0 },
      data: { completedAt, duration },
    });
    if (result.count === 0) {
      throw new TravelHistoryAlreadyFinalizedError();
    }
    return prisma.travelHistory.findFirstOrThrow({ where: { id, userId } });
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.travelHistory.updateMany({
      where: { id, userId, duration: 0 },
      data: { completedAt, duration },
    });
    if (result.count === 0) {
      throw new TravelHistoryAlreadyFinalizedError();
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        currentLatitude: existing.toLatitude,
        currentLongitude: existing.toLongitude,
        currentLocationName: existing.toLocationName,
      },
    });
    return tx.travelHistory.findFirstOrThrow({ where: { id, userId } });
  });
}
