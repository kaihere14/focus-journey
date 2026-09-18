"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  VEHICLE_OPTIONS,
  getVehicleOption,
  type VehicleKey,
} from "@/config/vehicles";
import { cn } from "@/lib/utils";

export function VehicleSelector({
  selected,
  onSelect,
}: {
  selected: VehicleKey;
  onSelect: (key: VehicleKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = getVehicleOption(selected);
  const CurrentIcon = current.icon;

  return (
    <div className="pointer-events-auto relative">
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ transformOrigin: "bottom" }}
            className="absolute bottom-full z-20 mb-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-black/35 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {VEHICLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = option.key === selected;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onSelect(option.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-expanded={open}
        aria-label="Choose vehicle"
        onClick={() => setOpen((value) => !value)}
        className="relative z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition-colors hover:bg-black/45"
      >
        <CurrentIcon className="size-4" strokeWidth={1.75} />
        {current.label}
        <ChevronDown
          className={cn(
            "size-3.5 text-white/60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
