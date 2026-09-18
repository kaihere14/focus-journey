import { prisma } from "@/server/db/client";
import type { Vehicle, Prisma } from "@/generated/prisma/client";

export type AnalyticsRange = "daily" | "weekly" | "monthly" | "all";

export type RecentJourney = {
  id: string;
  fromLocationName: string;
  toLocationName: string;
  vehicle: Vehicle;
  distance: number;
  duration: number;
  startedAt: Date;
  completedAt: Date;
};

export type AnalyticsResult = {
  range: AnalyticsRange;
  totalDuration: number;
  journeyCount: number;
  averageDuration: number;
  totalDistance: number;
  vehicleBreakdown: Record<Vehicle, number>;
  recentJourneys: RecentJourney[];
  hasAnyHistory: boolean;
  insight: string | null;
};

const EMPTY_VEHICLE_BREAKDOWN: Record<Vehicle, number> = {
  CAR: 0,
  MOTORCYCLE: 0,
  BICYCLE: 0,
  WALKING: 0,
};

function getLocalParts(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const parts: Record<string, string> = {};
  for (const part of formatted) parts[part.type] = part.value;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Intl reports midnight as "24" in hour12: false; normalize to 0.
    hour: parts.hour === "24" ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/**
 * Converts a local wall-clock date/time in `timeZone` to the UTC instant it
 * represents, accounting for that zone's offset (including DST) at that
 * moment. Used so "today"/"this week"/"this month" boundaries line up with
 * the user's calendar rather than the server's UTC calendar.
 */
function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const asLocal = getLocalParts(new Date(naiveUtc), timeZone);
  const asLocalUtc = Date.UTC(
    asLocal.year,
    asLocal.month - 1,
    asLocal.day,
    asLocal.hour,
    asLocal.minute,
    asLocal.second,
  );
  const offsetMs = asLocalUtc - naiveUtc;
  return new Date(naiveUtc - offsetMs);
}

export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function getRangeBounds(
  range: AnalyticsRange,
  timeZone: string,
  now: Date = new Date(),
): { gte: Date; lt: Date } | null {
  if (range === "all") return null;

  const zone = safeTimeZone(timeZone);
  const local = getLocalParts(now, zone);

  if (range === "daily") {
    const start = zonedWallTimeToUtc(local.year, local.month, local.day, zone);
    return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
  }

  if (range === "weekly") {
    // Calendar week starting Monday.
    const calendarDate = new Date(
      Date.UTC(local.year, local.month - 1, local.day),
    );
    const daysSinceMonday = (calendarDate.getUTCDay() + 6) % 7;
    calendarDate.setUTCDate(calendarDate.getUTCDate() - daysSinceMonday);
    const start = zonedWallTimeToUtc(
      calendarDate.getUTCFullYear(),
      calendarDate.getUTCMonth() + 1,
      calendarDate.getUTCDate(),
      zone,
    );
    return { gte: start, lt: new Date(start.getTime() + 7 * 86_400_000) };
  }

  // monthly
  const start = zonedWallTimeToUtc(local.year, local.month, 1, zone);
  const nextMonthYear = local.month === 12 ? local.year + 1 : local.year;
  const nextMonth = local.month === 12 ? 1 : local.month + 1;
  const end = zonedWallTimeToUtc(nextMonthYear, nextMonth, 1, zone);
  return { gte: start, lt: end };
}

function formatDurationShort(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDistanceShort(meters: number): string {
  const km = meters / 1000;
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

function buildInsight(
  range: AnalyticsRange,
  journeyCount: number,
  totalDuration: number,
  totalDistance: number,
  longestDuration: number,
): string | null {
  if (journeyCount === 0) return null;
  switch (range) {
    case "daily":
      return `You've focused for ${formatDurationShort(totalDuration)} today.`;
    case "weekly":
      return `Your longest journey this week was ${formatDurationShort(longestDuration)}.`;
    case "monthly":
      return `You've travelled ${formatDistanceShort(totalDistance)} this month.`;
    case "all":
      return `You've completed ${journeyCount} journeys covering ${formatDistanceShort(totalDistance)}.`;
  }
}

export async function getAnalytics(
  userId: string,
  range: AnalyticsRange,
  timeZone: string,
): Promise<AnalyticsResult> {
  const bounds = getRangeBounds(range, timeZone);
  const where: Prisma.TravelHistoryWhereInput = bounds
    ? { userId, startedAt: { gte: bounds.gte, lt: bounds.lt } }
    : { userId };

  const [aggregate, vehicleGroups, recentJourneys, totalCount] =
    await Promise.all([
      prisma.travelHistory.aggregate({
        where,
        _sum: { duration: true, distance: true },
        _max: { duration: true },
        _count: { _all: true },
      }),
      prisma.travelHistory.groupBy({
        by: ["vehicle"],
        where,
        _count: { _all: true },
      }),
      prisma.travelHistory.findMany({
        where,
        orderBy: { completedAt: "desc" },
        take: 5,
        select: {
          id: true,
          fromLocationName: true,
          toLocationName: true,
          vehicle: true,
          distance: true,
          duration: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.travelHistory.count({ where: { userId } }),
    ]);

  const journeyCount = aggregate._count._all;
  const totalDuration = aggregate._sum.duration ?? 0;
  const totalDistance = aggregate._sum.distance ?? 0;
  const longestDuration = aggregate._max.duration ?? 0;
  const averageDuration =
    journeyCount > 0 ? Math.round(totalDuration / journeyCount) : 0;

  const vehicleBreakdown = { ...EMPTY_VEHICLE_BREAKDOWN };
  for (const group of vehicleGroups) {
    vehicleBreakdown[group.vehicle] = group._count._all;
  }

  return {
    range,
    totalDuration,
    journeyCount,
    averageDuration,
    totalDistance,
    vehicleBreakdown,
    recentJourneys,
    hasAnyHistory: totalCount > 0,
    insight: buildInsight(
      range,
      journeyCount,
      totalDuration,
      totalDistance,
      longestDuration,
    ),
  };
}
