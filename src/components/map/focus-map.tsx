"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed, Layers, Plus, Minus } from "lucide-react";
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  type MapboxStyleKey,
} from "@/config/mapbox";
import { MapControlButton } from "./map-control-button";

const DEFAULT_CENTER: [number, number] = [77.209, 28.6139];

function hidePoiLabels(map: mapboxgl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;
  for (const layer of style.layers) {
    if (
      "source-layer" in layer &&
      (layer["source-layer"] === "poi_label" || layer.id.includes("poi"))
    ) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }
}

export function FocusMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [styleKey, setStyleKey] = useState<MapboxStyleKey>("dark");
  const [locationLabel, setLocationLabel] = useState(() =>
    typeof navigator !== "undefined" && navigator.geolocation
      ? "Locating…"
      : "Location unavailable",
  );
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      accessToken: MAPBOX_TOKEN,
      container: containerRef.current,
      style: MAPBOX_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: 11,
      attributionControl: false,
      pitch: 0,
    });
    mapRef.current = map;

    map.on("style.load", () => hidePoiLabels(map));

    const markerEl = document.createElement("div");
    markerEl.className = "focus-map-marker";
    markerEl.innerHTML =
      '<span class="focus-map-marker-pulse"></span><span class="focus-map-marker-dot"></span>';
    markerRef.current = new mapboxgl.Marker({ element: markerEl });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  function fetchCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        const nextCoords: [number, number] = [longitude, latitude];
        setCoords(nextCoords);

        const map = mapRef.current;
        if (map) {
          markerRef.current?.setLngLat(nextCoords).addTo(map);
          map.flyTo({ center: nextCoords, zoom: 13, duration: 1500 });
        }

        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&access_token=${MAPBOX_TOKEN}`,
          );
          const data = await res.json();
          const place = data?.features?.[0]?.text;
          setLocationLabel(place ?? "Unknown location");
        } catch {
          setLocationLabel("Unknown location");
        }
      },
      () => setLocationLabel("Location unavailable"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  function locate() {
    setLocationLabel("Locating…");
    fetchCurrentLocation();
  }

  function toggleStyle() {
    const next: MapboxStyleKey = styleKey === "dark" ? "satellite" : "dark";
    setStyleKey(next);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAPBOX_STYLES[next]);
    map.once("style.load", () => hidePoiLabels(map));
  }

  return (
    <div
      style={{ position: "relative", height: "100%", width: "100%" }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-black"
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      <div className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 flex-col gap-2">
        <MapControlButton
          icon={LocateFixed}
          label="Locate me"
          onClick={locate}
          className="pointer-events-auto"
        />
        <MapControlButton
          icon={Layers}
          label="Toggle map style"
          active={styleKey === "satellite"}
          onClick={toggleStyle}
          className="pointer-events-auto"
        />
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex size-9 items-center justify-center text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Plus className="size-4" strokeWidth={1.75} />
          </button>
          <div className="h-px w-full bg-white/10" />
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex size-9 items-center justify-center text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Minus className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 text-white">
        <p className="text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">
          Current Location
        </p>
        <p className="text-sm font-medium">{locationLabel}</p>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 text-right text-white">
        <p className="text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">
          Coordinates
        </p>
        <p className="text-sm font-medium">
          {coords ? `${coords[1].toFixed(3)}, ${coords[0].toFixed(3)}` : "—"}
        </p>
      </div>
    </div>
  );
}
