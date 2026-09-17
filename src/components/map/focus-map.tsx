"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed, Layers, Plus, Minus } from "lucide-react";
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  type MapboxStyleKey,
} from "@/config/mapbox";
import { MapControlButton } from "./map-control-button";
import { MapStyleModal } from "./map-style-modal";

const DEFAULT_CENTER: [number, number] = [77.209, 28.6139];
const ROUTE_SOURCE_ID = "focus-journey-route";
const ROUTE_LAYER_ID = "focus-journey-route-line";

export type JourneyDestination = {
  name: string;
  placeName: string;
  center: [number, number];
};

export type RouteSummary = {
  distanceKm: number;
  durationMin: number;
};

export type LabelMode = "minimal" | "detailed";

export type FocusMapHandle = {
  showRoute: (destination: JourneyDestination) => Promise<RouteSummary | null>;
  clearRoute: () => void;
  setLabelMode: (mode: LabelMode) => void;
  zoomToCurrentLocation: () => void;
};

const CLUTTER_SYMBOL_PATTERN =
  /poi|airport|transit|natural|water|waterway|marine|park|golf/i;
const ROAD_LINE_PATTERN =
  /^road-(motorway|trunk|primary|secondary|tertiary|street)/;

function applyLabelMode(map: mapboxgl.Map, mode: LabelMode) {
  const style = map.getStyle();
  if (!style?.layers) return;
  const detailed = mode === "detailed";
  for (const layer of style.layers) {
    if (layer.id === ROUTE_LAYER_ID) continue;
    const isBoundary =
      "source-layer" in layer &&
      (layer["source-layer"] === "admin" || layer.id.includes("boundary"));
    if (isBoundary) {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }
    if (layer.type === "line") {
      const show = detailed && ROAD_LINE_PATTERN.test(layer.id);
      map.setLayoutProperty(layer.id, "visibility", show ? "visible" : "none");
      continue;
    }
    if (layer.type === "symbol") {
      const isClutter = CLUTTER_SYMBOL_PATTERN.test(layer.id);
      const isPlaceLabel = /label/i.test(layer.id) && !isClutter;
      const show = detailed && isPlaceLabel;
      map.setLayoutProperty(layer.id, "visibility", show ? "visible" : "none");
    }
  }
}

function restoreRouteData(map: mapboxgl.Map, route: GeoJSON.Feature | null) {
  if (!route) return;
  const source = map.getSource(ROUTE_SOURCE_ID) as
    mapboxgl.GeoJSONSource | undefined;
  source?.setData(route);
}

function addRouteLayer(map: mapboxgl.Map) {
  if (map.getSource(ROUTE_SOURCE_ID)) return;
  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#ffffff",
      "line-width": 4,
      "line-opacity": 0.9,
    },
  });
}

export const FocusMap = forwardRef<
  FocusMapHandle,
  {
    onLocationChange?: (
      city: string | null,
      coords: [number, number] | null,
    ) => void;
  }
>(function FocusMap({ onLocationChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const currentCoordsRef = useRef<[number, number] | null>(null);
  const labelModeRef = useRef<LabelMode>("minimal");
  const routeDataRef = useRef<GeoJSON.Feature | null>(null);
  const destinationCoordsRef = useRef<[number, number] | null>(null);
  const [styleKey, setStyleKey] = useState<MapboxStyleKey>("satellite");
  const [labelsEnabled, setLabelsEnabled] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      accessToken: MAPBOX_TOKEN,
      container: containerRef.current,
      style: MAPBOX_STYLES.satellite,
      projection: "globe",
      center: DEFAULT_CENTER,
      zoom: 1.5,
      attributionControl: false,
      pitch: 0,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      applyLabelMode(map, labelModeRef.current);
      addRouteLayer(map);
      restoreRouteData(map, routeDataRef.current);
      if (destinationCoordsRef.current) {
        destinationMarkerRef.current?.setLngLat(destinationCoordsRef.current);
      }
    });

    const markerEl = document.createElement("div");
    markerEl.className = "focus-map-marker";
    markerEl.innerHTML = '<span class="focus-map-marker-dot"></span>';
    markerRef.current = new mapboxgl.Marker({ element: markerEl });

    const destEl = document.createElement("div");
    destEl.className = "focus-map-marker";
    destEl.innerHTML =
      '<span class="focus-map-marker-dot focus-map-marker-dot--dest"></span>';
    destinationMarkerRef.current = new mapboxgl.Marker({ element: destEl });

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
        currentCoordsRef.current = nextCoords;

        const map = mapRef.current;
        if (map) {
          markerRef.current?.setLngLat(nextCoords).addTo(map);
          map.flyTo({ center: nextCoords, zoom: 3.5, duration: 1000 });
        }

        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&access_token=${MAPBOX_TOKEN}`,
          );
          const data = await res.json();
          const place = data?.features?.[0]?.text;
          onLocationChange?.(place ?? null, nextCoords);
        } catch {
          onLocationChange?.(null, nextCoords);
        }
      },
      () => onLocationChange?.(null, null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  function locate() {
    fetchCurrentLocation();
  }

  function selectStyle(next: MapboxStyleKey) {
    setStyleKey(next);
    mapRef.current?.setStyle(MAPBOX_STYLES[next]);
  }

  function toggleLabels() {
    const next = !labelsEnabled;
    setLabelsEnabled(next);
    labelModeRef.current = next ? "detailed" : "minimal";
    const map = mapRef.current;
    if (map) applyLabelMode(map, labelModeRef.current);
  }

  useImperativeHandle(ref, () => ({
    async showRoute(destination) {
      const map = mapRef.current;
      const origin = currentCoordsRef.current;
      if (!map || !origin) return null;

      destinationMarkerRef.current?.setLngLat(destination.center).addTo(map);
      destinationCoordsRef.current = destination.center;

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination.center[0]},${destination.center[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
        );
        const data = await res.json();
        const route = data?.routes?.[0];
        if (!route) return null;

        const routeFeature: GeoJSON.Feature = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };
        routeDataRef.current = routeFeature;
        const source = map.getSource(ROUTE_SOURCE_ID) as
          mapboxgl.GeoJSONSource | undefined;
        source?.setData(routeFeature);

        const bounds = new mapboxgl.LngLatBounds(origin, origin);
        bounds.extend(destination.center);
        map.fitBounds(bounds, {
          padding: { top: 140, bottom: 220, left: 80, right: 80 },
          duration: 1200,
        });

        return {
          distanceKm: Math.round(route.distance / 100) / 10,
          durationMin: Math.round(route.duration / 60),
        };
      } catch {
        return null;
      }
    },
    clearRoute() {
      const map = mapRef.current;
      destinationMarkerRef.current?.remove();
      destinationCoordsRef.current = null;
      routeDataRef.current = null;
      const source = map?.getSource(ROUTE_SOURCE_ID) as
        mapboxgl.GeoJSONSource | undefined;
      source?.setData({ type: "FeatureCollection", features: [] });
    },
    setLabelMode(mode) {
      labelModeRef.current = mode;
      const map = mapRef.current;
      if (map) applyLabelMode(map, mode);
    },
    zoomToCurrentLocation() {
      const map = mapRef.current;
      const coords = currentCoordsRef.current;
      if (!map || !coords) return;
      map.flyTo({ center: coords, zoom: 7, duration: 1200 });
    },
  }));

  return (
    <div
      style={{ position: "relative", height: "100%", width: "100%" }}
      className="overflow-hidden bg-black"
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      <div className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 flex-col gap-2">
        <MapControlButton
          icon={LocateFixed}
          label="Locate me"
          onClick={locate}
          className="pointer-events-auto"
        />
        <div className="pointer-events-auto relative">
          <MapControlButton
            icon={Layers}
            label="Choose map style"
            active={styleModalOpen}
            onClick={() => setStyleModalOpen((open) => !open)}
            className="pointer-events-auto"
          />
          <MapStyleModal
            open={styleModalOpen}
            styleKey={styleKey}
            labelsEnabled={labelsEnabled}
            onSelectStyle={selectStyle}
            onToggleLabels={toggleLabels}
            onClose={() => setStyleModalOpen(false)}
          />
        </div>
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
    </div>
  );
});
