"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const CONFETTI_COLORS = ["#ffffff", "#facc15", "#fb7185", "#38bdf8", "#4ade80"];

function firePartyPoppers() {
  const base = {
    colors: CONFETTI_COLORS,
    zIndex: 60,
    ticks: 220,
    gravity: 0.9,
    scalar: 1.1,
  };

  // Two poppers from the bottom corners, aimed toward the center.
  confetti({
    ...base,
    particleCount: 90,
    angle: 60,
    spread: 60,
    startVelocity: 55,
    origin: { x: 0, y: 0.85 },
  });
  confetti({
    ...base,
    particleCount: 90,
    angle: 120,
    spread: 60,
    startVelocity: 55,
    origin: { x: 1, y: 0.85 },
  });

  // Center burst slightly after, so the popup lands in a shower.
  const centerBurst = window.setTimeout(() => {
    confetti({
      ...base,
      particleCount: 140,
      spread: 100,
      startVelocity: 40,
      origin: { x: 0.5, y: 0.35 },
    });
  }, 250);

  return () => {
    window.clearTimeout(centerBurst);
    confetti.reset();
  };
}

function formatDuration(ms: number) {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function JourneyCompleteModal({
  toLocationName,
  distanceKm,
  durationMs,
  onDismiss,
}: {
  toLocationName: string;
  distanceKm: number;
  durationMs: number;
  onDismiss: () => void;
}) {
  useEffect(() => firePartyPoppers(), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/70 p-6 text-center backdrop-blur-xl"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
          <MapPin className="size-5 text-white" strokeWidth={1.75} />
        </div>

        <p className="mt-4 text-xs font-medium tracking-[0.2em] text-white/50 uppercase">
          You made it
        </p>
        <p className="mt-1 text-xl font-semibold text-white">
          Welcome to {toLocationName}
        </p>
        <p className="mt-2 text-sm text-white/60">
          Focus session complete. Your journey has been saved.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-[11px] font-medium tracking-wide text-white/50">
              Distance
            </p>
            <p className="mt-0.5 text-base font-semibold text-white">
              {Math.round(distanceKm).toLocaleString()} km
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-[11px] font-medium tracking-wide text-white/50">
              Focused for
            </p>
            <p className="mt-0.5 text-base font-semibold text-white">
              {formatDuration(durationMs)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98]"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
