"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import type { JourneyDestination } from "./focus-map";

type GeocodeFeature = {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
};

export function DestinationSearch({
  proximity,
  onSelect,
}: {
  proximity: [number, number] | null;
  onSelect: (destination: JourneyDestination) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeFeature[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const proximityParam = proximity
        ? `&proximity=${proximity[0]},${proximity[1]}`
        : "";
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            trimmed,
          )}.json?autocomplete=true&limit=5${proximityParam}&access_token=${MAPBOX_TOKEN}`,
        );
        const data = await res.json();
        setResults(data?.features ?? []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, proximity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto absolute top-4 right-4 w-72 sm:w-80"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (value.trim().length < 2) setResults([]);
          }}
          placeholder="Where are you going?"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
        <Search className="size-4 shrink-0 text-white/50" strokeWidth={1.75} />
      </div>

      {results.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/15 bg-black/35 backdrop-blur-xl">
          {results.map((feature, i) => (
            <button
              key={feature.id}
              type="button"
              onClick={() =>
                onSelect({
                  name: feature.text,
                  placeName: feature.place_name,
                  center: feature.center,
                })
              }
              className={`flex w-full flex-col items-start px-4 py-2.5 text-left transition-colors hover:bg-white/10 ${
                i !== 0 ? "border-t border-white/10" : ""
              }`}
            >
              <span className="text-sm font-medium text-white">
                {feature.text}
              </span>
              <span className="text-xs text-white/55">
                {feature.place_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
