"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Car, Motorbike, Bike, Footprints, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AnalyticsRange = "daily" | "weekly" | "monthly" | "all";

type RecentJourney = {
  id: string;
  fromLocationName: string;
  toLocationName: string;
  vehicle: "CAR" | "MOTORCYCLE" | "BICYCLE" | "WALKING";
  distance: number;
  duration: number;
  startedAt: string;
  completedAt: string;
};

type AnalyticsResponse = {
  range: AnalyticsRange;
  totalDuration: number;
  journeyCount: number;
  averageDuration: number;
  totalDistance: number;
  vehicleBreakdown: Record<
    "CAR" | "MOTORCYCLE" | "BICYCLE" | "WALKING",
    number
  >;
  recentJourneys: RecentJourney[];
  hasAnyHistory: boolean;
  insight: string | null;
};

const RANGE_TABS: { key: AnalyticsRange; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "all", label: "All Time" },
];

const VEHICLE_ROWS: {
  key: RecentJourney["vehicle"];
  icon: typeof Car;
  label: string;
}[] = [
  { key: "CAR", icon: Car, label: "Car" },
  { key: "MOTORCYCLE", icon: Motorbike, label: "Motorcycle" },
  { key: "BICYCLE", icon: Bike, label: "Bicycle" },
  { key: "WALKING", icon: Footprints, label: "Walking" },
];

function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

function formatJourneyDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday, ${time}`;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

export function AnalyticsPanel({ onClose }: { onClose: () => void }) {
  const [selectedRange, setSelectedRange] = useState<AnalyticsRange>("daily");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cacheRef = useRef<Partial<Record<AnalyticsRange, AnalyticsResponse>>>(
    {},
  );

  useEffect(() => {
    const cached = cacheRef.current[selectedRange];
    if (cached) {
      setData(cached);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    fetch(
      `/api/analytics?range=${selectedRange}&tz=${encodeURIComponent(timeZone)}`,
    )
      .then((res) =>
        res.ok ? (res.json() as Promise<AnalyticsResponse>) : Promise.reject(),
      )
      .then((json) => {
        if (cancelled) return;
        cacheRef.current[selectedRange] = json;
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRange]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="pointer-events-auto fixed inset-0 z-30">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-x-4 bottom-6 z-40 max-h-[75vh] overflow-y-auto rounded-2xl border border-white/15 bg-black/40 p-5 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:left-6 sm:w-[380px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-white/50">
              FocusJourney
            </p>
            <p className="text-lg font-semibold text-white">Analytics</p>
          </div>
          <button
            type="button"
            aria-label="Close analytics"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {data?.insight && (
          <p className="mt-3 text-sm text-white/70">{data.insight}</p>
        )}

        <div className="mt-4 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {RANGE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedRange(tab.key)}
              className={cn(
                "flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
                selectedRange === tab.key
                  ? "bg-white text-black"
                  : "text-white/55 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!data && loading && (
          <p className="mt-6 py-6 text-center text-sm text-white/50">
            Loading analytics…
          </p>
        )}

        {!data && !loading && error && (
          <p className="mt-6 py-6 text-center text-sm text-white/50">
            Couldn&apos;t load analytics. Try again.
          </p>
        )}

        {data && !data.hasAnyHistory && (
          <div className="mt-6 flex flex-col items-center gap-1 py-6 text-center">
            <p className="text-sm font-medium text-white/70">
              No journeys yet.
            </p>
            <p className="max-w-[240px] text-xs text-white/45">
              Complete your first journey and your focus history will appear
              here.
            </p>
          </div>
        )}

        {data && data.hasAnyHistory && (
          <div
            className={cn(
              "transition-opacity",
              loading ? "opacity-50" : "opacity-100",
            )}
          >
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xl font-semibold text-white">
                  {formatDuration(data.totalDuration)}
                </p>
                <p className="text-xs text-white/50">Focus Time</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {data.journeyCount}
                </p>
                <p className="text-xs text-white/50">Journeys</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {formatDuration(data.averageDuration)}
                </p>
                <p className="text-xs text-white/50">Avg Duration</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {formatDistance(data.totalDistance)}
                </p>
                <p className="text-xs text-white/50">Distance</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium tracking-wide text-white/50">
                Vehicle
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                {VEHICLE_ROWS.map((row) => {
                  const Icon = row.icon;
                  return (
                    <span
                      key={row.key}
                      title={row.label}
                      className="flex items-center gap-1.5 text-sm text-white/80"
                    >
                      <Icon
                        className="size-3.5 text-white/50"
                        strokeWidth={1.75}
                      />
                      {data.vehicleBreakdown[row.key]}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium tracking-wide text-white/50">
                Recent Journeys
              </p>
              {data.recentJourneys.length === 0 ? (
                <p className="mt-2 text-xs text-white/40">
                  No journeys in this range.
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  {data.recentJourneys.map((journey) => (
                    <div key={journey.id}>
                      <p className="text-sm text-white/90">
                        {journey.fromLocationName} → {journey.toLocationName}
                      </p>
                      <p className="text-xs text-white/50">
                        {formatDistance(journey.distance)} ·{" "}
                        {formatDuration(journey.duration)}
                      </p>
                      <p className="text-xs text-white/35">
                        {formatJourneyDate(journey.completedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
