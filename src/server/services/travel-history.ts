import { prisma } from "@/server/db/client";
import { invalidateAnalyticsCache } from "@/server/services/analytics";
import type { Vehicle, TravelHistory } from "@/generated/prisma/client";
import type { VehicleKey } from "@/config/vehicles";

const VEHICLE_KEY_TO_ENUM: Record<VehicleKey, Vehicle> = {
  car: "CAR",
  motorcycle: "MOTORCYCLE",
  truck: "TRUCK",
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
  plannedDurationSec?: number;
};

export async function createTravelHistory(
  input: CreateTravelHistoryInput,
): Promise<TravelHistory> {
  const created = await prisma.travelHistory.create({
    data: {
      ...input,
      status: "ACTIVE",
      // Required by the schema; meaningless until finalizeTravelHistory
      // overwrites them (status is what actually marks a row "active").
      completedAt: input.startedAt,
      duration: 0,
      elapsedActiveMs: 0,
    },
  });
  await invalidateAnalyticsCache(input.userId);
  return created;
}

/**
 * Persists how much active (in-tab, online) time a journey has accrued so
 * far. Called periodically and on tab-close while a journey is ACTIVE, so
 * a resume can pick up from here instead of the wall-clock gap since
 * startedAt. Guarded by status: "ACTIVE" so a stray late checkpoint (e.g.
 * a beacon that lands after the journey was already finalized) can't
 * resurrect a completed/failed row.
 */
export async function checkpointTravelHistory({
  id,
  userId,
  elapsedActiveMs,
}: {
  id: string;
  userId: string;
  elapsedActiveMs: number;
}): Promise<void> {
  await prisma.travelHistory.updateMany({
    where: { id, userId, status: "ACTIVE" },
    data: { elapsedActiveMs: Math.round(elapsedActiveMs) },
  });
}

/**
 * A user can have at most one journey in flight. Used on page load to
 * detect an active session left behind by a refresh/crash so the client
 * can offer to resume it instead of silently orphaning it.
 */
export function getActiveTravelHistoryForUser(
  userId: string,
): Promise<TravelHistory | null> {
  return prisma.travelHistory.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
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
  if (result.count > 0) {
    await invalidateAnalyticsCache(userId);
  }
  return result.count > 0;
}

/**
 * Marks a journey as finished: COMPLETED if it ran its full course, FAILED
 * if the user exited early or it was abandoned by a refresh. Only counted
 * ("success"/"failed") once finalized — an ACTIVE row never shows up in
 * analytics. The update is guarded by `status: "ACTIVE"` in its `where`
 * clause so two concurrent requests can't both finalize the same record.
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
  if (existing.status !== "ACTIVE") {
    throw new TravelHistoryAlreadyFinalizedError();
  }

  const completedAt = new Date();
  const duration = Math.max(1, Math.round(durationSeconds));
  const status = completed ? "COMPLETED" : "FAILED";

  if (!completed) {
    const result = await prisma.travelHistory.updateMany({
      where: { id, userId, status: "ACTIVE" },
      data: { completedAt, duration, status },
    });
    if (result.count === 0) {
      throw new TravelHistoryAlreadyFinalizedError();
    }
    await invalidateAnalyticsCache(userId);
    return prisma.travelHistory.findFirstOrThrow({ where: { id, userId } });
  }

  const finalized = await prisma.$transaction(async (tx) => {
    const result = await tx.travelHistory.updateMany({
      where: { id, userId, status: "ACTIVE" },
      data: { completedAt, duration, status },
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
  await invalidateAnalyticsCache(userId);
  return finalized;
}
