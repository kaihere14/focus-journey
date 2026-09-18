"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getJourneyVolume, setJourneyVolume } from "@/lib/journey-sound";
import { cn } from "@/lib/utils";

export function JourneyAudioControl() {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(() => getJourneyVolume());

  function handleChange(next: number) {
    setVolume(next);
    setJourneyVolume(next);
  }

  return (
    <div className="pointer-events-auto relative">
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      )}

      <button
        type="button"
        aria-label={
          volume === 0 ? "Unmute journey sound" : "Journey sound volume"
        }
        title="Journey sound volume"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative z-20 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white",
          open && "bg-white/15 text-white",
        )}
      >
        {volume === 0 ? (
          <VolumeX className="size-4" strokeWidth={1.75} />
        ) : (
          <Volume2 className="size-4" strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => handleChange(Number(event.target.value))}
            className="h-1 w-24 cursor-pointer accent-white"
          />
        </div>
      )}
    </div>
  );
}
