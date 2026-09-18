"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { JourneyDestination, RouteSummary } from "./focus-map";
import { cn } from "@/lib/utils";

export function JourneyPanel({
  destination,
  route,
  onClose,
  onBeginJourney,
  className,
}: {
  destination: JourneyDestination;
  route: RouteSummary | null;
  onClose: () => void;
  onBeginJourney: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "pointer-events-auto rounded-2xl border border-white/15 bg-black/35 p-5 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{destination.name}</p>
          <p className="text-sm text-white/55">{destination.placeName}</p>
        </div>
        <button
          type="button"
          aria-label="Close journey preview"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      {route && (
        <p className="mt-3 text-sm text-white/70">
          {route.distanceKm} km · ~{formatDuration(route.durationMin)}
        </p>
      )}

      <button
        type="button"
        onClick={onBeginJourney}
        className="mt-4 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98]"
      >
        Begin Journey
      </button>
    </motion.div>
  );
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
