"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const CONSEQUENCES = [
  "Your progress on this route will be lost",
  "The journey is saved as incomplete in your history",
  "You can't resume it later, so you'll have to start over",
];

export function ExitJourneyModal({
  toLocationName,
  progress,
  onConfirm,
  onCancel,
  busy,
}: {
  toLocationName: string | null;
  progress: number | null;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel]);

  const percent =
    progress != null
      ? Math.min(100, Math.max(0, Math.round(progress * 100)))
      : null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6"
      onClick={() => !busy && onCancel()}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-journey-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25 }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/70 p-6 text-center backdrop-blur-xl"
      >
        <p id="exit-journey-title" className="text-lg font-semibold text-white">
          End this journey?
        </p>
        <p className="mt-2 text-sm text-white/60">
          {toLocationName ? (
            <>
              You&apos;re on your way to{" "}
              <span className="text-white/85">{toLocationName}</span>
              {percent != null && <> and {percent}% of the way there</>}.
            </>
          ) : (
            "You're in the middle of a journey."
          )}{" "}
          Ending now means:
        </p>

        <ul className="mt-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/70">
          {CONSEQUENCES.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            autoFocus
            className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy && (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            )}
            End journey
          </button>
        </div>
      </motion.div>
    </div>
  );
}
