"use client";

import { X } from "lucide-react";
import { MAPBOX_STYLE_OPTIONS, type MapboxStyleKey } from "@/config/mapbox";
import { cn } from "@/lib/utils";

export function MapStyleModal({
  open,
  styleKey,
  labelsEnabled,
  onSelectStyle,
  onToggleLabels,
  onClose,
}: {
  open: boolean;
  styleKey: MapboxStyleKey;
  labelsEnabled: boolean;
  onSelectStyle: (key: MapboxStyleKey) => void;
  onToggleLabels: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute top-1/2 right-full z-20 mr-3 w-[300px] -translate-y-1/2 rounded-3xl border border-white/10 bg-neutral-900/90 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Choose Map Style
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MAPBOX_STYLE_OPTIONS.map((option) => {
            const selected = option.key === styleKey;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectStyle(option.key)}
                className={cn(
                  "relative h-24 overflow-hidden rounded-2xl text-left ring-2 ring-transparent transition-all",
                  option.previewClassName,
                  selected && "ring-white",
                )}
              >
                <span className="absolute bottom-2 left-3 text-sm font-medium text-white">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleLabels}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
        >
          <span className="text-sm font-medium text-white">Labels</span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              labelsEnabled ? "text-emerald-400" : "text-white/40",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                labelsEnabled ? "bg-emerald-400" : "bg-white/40",
              )}
            />
            {labelsEnabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>
    </>
  );
}
