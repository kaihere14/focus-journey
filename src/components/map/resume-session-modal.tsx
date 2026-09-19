"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function ResumeSessionModal({
  toLocationName,
  onContinue,
  onQuit,
  busy,
}: {
  toLocationName: string;
  onContinue: () => void;
  onQuit: () => void;
  busy: boolean;
}) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/70 p-6 text-center backdrop-blur-xl"
      >
        <p className="text-lg font-semibold text-white">Journey in progress</p>
        <p className="mt-2 text-sm text-white/60">
          You still have an unfinished journey to{" "}
          <span className="text-white/85">{toLocationName}</span>. Continue it,
          or quit and start fresh.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onContinue}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {busy && (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            )}
            Continue journey
          </button>
          <button
            type="button"
            onClick={onQuit}
            disabled={busy}
            className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            Quit journey
          </button>
        </div>
      </motion.div>
    </div>
  );
}
