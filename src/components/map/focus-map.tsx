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
import { getVehicleOption, type VehicleKey } from "@/config/vehicles";
import { MapControlButton } from "./map-control-button";
import { MapStyleModal } from "./map-style-modal";
import { MapLoader } from "./map-loader";

const DEFAULT_CENTER: [number, number] = [77.209, 28.6139];
const START_ZOOM = 3.5;
const ROUTE_SOURCE_ID = "focus-journey-route";
const ROUTE_LAYER_ID = "focus-journey-route-line";

const JOURNEY_ZOOM = 16.2;
const JOURNEY_PITCH = 38;
const JOURNEY_PADDING = { top: 220, bottom: 0, left: 0, right: 0 };
const CAMERA_CENTER_RATE = 0.055;
const CAMERA_BEARING_RATE = 0.02;
const CAMERA_ZOOM_RATE = 0.06;
const BEARING_LOOKAHEAD_KM = 0.05;
const PROGRESS_REPORT_INTERVAL_MS = 200;
const ZOOM_SNAP_EPSILON = 0.01;
const PITCH_SNAP_EPSILON = 0.1;
const BEARING_DEADZONE_DEG = 0.4;

export type JourneyDestination = {
  name: string;
  placeName: string;
  center: [number, number];
};

export type RouteSummary = {
  distanceKm: number;
  durationMin: number;
};

export type MapboxRoutingProfile = "driving" | "cycling" | "walking";

export type LabelMode = "minimal" | "detailed";

export type FocusMapHandle = {
  showRoute: (
    destination: JourneyDestination,
    profile?: MapboxRoutingProfile,
    origin?: [number, number],
  ) => Promise<RouteSummary | null>;
  clearRoute: () => void;
  setLabelMode: (mode: LabelMode) => void;
  zoomToCurrentLocation: () => void;
  resetToStart: () => void;
  setCurrentLocation: (coords: [number, number]) => void;
  beginJourney: (
    vehicle: VehicleKey,
    startedAt: number,
    totalDurationMs: number,
  ) => void;
  endJourney: () => void;
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

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function smoothRouteCoordinates(
  coordinates: [number, number][],
): [number, number][] {
  if (coordinates.length < 3) return coordinates;
  const smoothed: [number, number][] = [coordinates[0]];
  for (let i = 1; i < coordinates.length - 1; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const next = coordinates[i + 1];
    smoothed.push([
      (prev[0] + curr[0] * 2 + next[0]) / 4,
      (prev[1] + curr[1] * 2 + next[1]) / 4,
    ]);
  }
  smoothed.push(coordinates[coordinates.length - 1]);
  return smoothed;
}

function buildRouteMeta(coordinates: [number, number][]) {
  const segmentLengths: number[] = [];
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const d = haversineKm(coordinates[i - 1], coordinates[i]);
    segmentLengths.push(d);
    total += d;
  }
  return { segmentLengths, total };
}

function pointAtFraction(
  coordinates: [number, number][],
  segmentLengths: number[],
  total: number,
  fraction: number,
): [number, number] | null {
  if (coordinates.length === 0) return null;
  if (coordinates.length === 1 || total === 0) return coordinates[0];

  const target = fraction * total;
  let covered = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (covered + segLen >= target || i === segmentLengths.length - 1) {
      const segFraction = segLen === 0 ? 0 : (target - covered) / segLen;
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];
      return [
        lon1 + (lon2 - lon1) * segFraction,
        lat1 + (lat2 - lat1) * segFraction,
      ];
    }
    covered += segLen;
  }
  return coordinates[coordinates.length - 1];
}

function bearingBetween(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lon1 = toRad(a[0]);
  const lat1 = toRad(a[1]);
  const lon2 = toRad(b[0]);
  const lat2 = toRad(b[1]);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number) {
  const diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
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
    onJourneyProgress?: (progress: number) => void;
    // Only fall back to device GPS when there is no stored FocusJourney
    // location yet (first-ever use, no journeys taken). Otherwise the
    // caller drives the current position via `setCurrentLocation`.
    autoLocate?: boolean;
    // True while the caller is still checking the DB for a saved location.
    // Keeps the loader up so the map never shows blank/unexplained.
    locatingSavedLocation?: boolean;
  }
>(function FocusMap(
  {
    onLocationChange,
    onJourneyProgress,
    autoLocate = true,
    locatingSavedLocation = false,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const currentCoordsRef = useRef<[number, number] | null>(null);
  const labelModeRef = useRef<LabelMode>("minimal");
  const routeDataRef = useRef<GeoJSON.Feature | null>(null);
  const destinationCoordsRef = useRef<[number, number] | null>(null);
  const routeCoordsRef = useRef<[number, number][]>([]);
  const routeSegmentLengthsRef = useRef<number[]>([]);
  const routeTotalLengthRef = useRef(0);
  const journeyRef = useRef<{
    startedAt: number;
    totalDurationMs: number;
  } | null>(null);
  const journeyRafRef = useRef<number | null>(null);
  const cameraStateRef = useRef<{
    lng: number;
    lat: number;
    zoom: number;
    pitch: number;
    bearing: number;
  } | null>(null);
  const onJourneyProgressRef = useRef(onJourneyProgress);
  const lastProgressReportRef = useRef(0);
  const mapReadyRef = useRef(false);
  const hasInitialCenteredRef = useRef(false);
  const userControllingCameraRef = useRef(false);
  const [styleKey, setStyleKey] = useState<MapboxStyleKey>("satellite");
  const [labelsEnabled, setLabelsEnabled] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

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
      antialias: true,
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

    map.on("load", () => {
      mapReadyRef.current = true;
      setMapReady(true);
      if (currentCoordsRef.current && !hasInitialCenteredRef.current) {
        hasInitialCenteredRef.current = true;
        map.flyTo({
          center: currentCoordsRef.current,
          zoom: START_ZOOM,
          duration: 1200,
        });
      }
    });

    const markUserControlled = (e?: unknown) => {
      if ((e as { originalEvent?: unknown } | undefined)?.originalEvent) {
        userControllingCameraRef.current = true;
      }
    };
    map.on("dragstart", markUserControlled);
    map.on("zoomstart", markUserControlled);
    map.on("rotatestart", markUserControlled);
    map.on("pitchstart", markUserControlled);

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
      if (journeyRafRef.current !== null) {
        cancelAnimationFrame(journeyRafRef.current);
      }
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
          hasInitialCenteredRef.current = true;
          map.flyTo({ center: nextCoords, zoom: START_ZOOM, duration: 1000 });
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
    if (autoLocate) fetchCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate]);

  useEffect(() => {
    onJourneyProgressRef.current = onJourneyProgress;
  }, [onJourneyProgress]);

  function locate() {
    const map = mapRef.current;
    const cam = cameraStateRef.current;
    if (journeyRef.current && map && cam) {
      userControllingCameraRef.current = false;
      map.flyTo({
        center: [cam.lng, cam.lat],
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
        duration: 1000,
      });
      return;
    }
    fetchCurrentLocation();
  }

  function stopJourneyLoop() {
    if (journeyRafRef.current !== null) {
      cancelAnimationFrame(journeyRafRef.current);
      journeyRafRef.current = null;
    }
    journeyRef.current = null;
    userControllingCameraRef.current = false;
  }

  function runJourneyLoop() {
    const map = mapRef.current;
    const marker = vehicleMarkerRef.current;
    const journey = journeyRef.current;
    const coords = routeCoordsRef.current;
    const cam = cameraStateRef.current;
    if (!map || !marker || !journey || !cam || coords.length === 0) {
      journeyRafRef.current = null;
      return;
    }

    const elapsed = Date.now() - journey.startedAt;
    const progress = Math.min(
      1,
      Math.max(0, elapsed / journey.totalDurationMs),
    );

    const point = pointAtFraction(
      coords,
      routeSegmentLengthsRef.current,
      routeTotalLengthRef.current,
      progress,
    );

    if (point) {
      marker.setLngLat(point);

      const total = routeTotalLengthRef.current;
      const lookAheadFraction =
        total > 0
          ? Math.min(1, progress + BEARING_LOOKAHEAD_KM / total)
          : progress;
      const lookAheadPoint =
        pointAtFraction(
          coords,
          routeSegmentLengthsRef.current,
          total,
          lookAheadFraction,
        ) ?? point;

      const dx = lookAheadPoint[0] - point[0];
      const dy = lookAheadPoint[1] - point[1];
      const hasDirection = Math.abs(dx) > 1e-9 || Math.abs(dy) > 1e-9;
      const rawTargetBearing = hasDirection
        ? bearingBetween(point, lookAheadPoint)
        : cam.bearing;

      const bearingDiff = Math.abs(
        ((rawTargetBearing - cam.bearing + 540) % 360) - 180,
      );
      const targetBearing =
        bearingDiff > BEARING_DEADZONE_DEG ? rawTargetBearing : cam.bearing;

      cam.lng = lerp(cam.lng, point[0], CAMERA_CENTER_RATE);
      cam.lat = lerp(cam.lat, point[1], CAMERA_CENTER_RATE);
      cam.zoom =
        Math.abs(cam.zoom - JOURNEY_ZOOM) > ZOOM_SNAP_EPSILON
          ? lerp(cam.zoom, JOURNEY_ZOOM, CAMERA_ZOOM_RATE)
          : JOURNEY_ZOOM;
      cam.pitch =
        Math.abs(cam.pitch - JOURNEY_PITCH) > PITCH_SNAP_EPSILON
          ? lerp(cam.pitch, JOURNEY_PITCH, CAMERA_ZOOM_RATE)
          : JOURNEY_PITCH;
      cam.bearing =
        targetBearing === cam.bearing
          ? cam.bearing
          : lerpAngle(cam.bearing, targetBearing, CAMERA_BEARING_RATE);

      if (!userControllingCameraRef.current) {
        map.jumpTo({
          center: [cam.lng, cam.lat],
          zoom: cam.zoom,
          pitch: cam.pitch,
          bearing: cam.bearing,
        });
      }
    }

    const now = Date.now();
    if (now - lastProgressReportRef.current >= PROGRESS_REPORT_INTERVAL_MS) {
      lastProgressReportRef.current = now;
      onJourneyProgressRef.current?.(progress);
    }

    if (progress >= 1) {
      onJourneyProgressRef.current?.(1);
      journeyRafRef.current = null;
      return;
    }

    journeyRafRef.current = requestAnimationFrame(runJourneyLoop);
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
    if (map && mapReadyRef.current) applyLabelMode(map, labelModeRef.current);
  }

  useImperativeHandle(ref, () => ({
    async showRoute(destination, profile = "driving", originOverride) {
      const map = mapRef.current;
      const origin = originOverride ?? currentCoordsRef.current;
      if (!map || !origin || !mapReadyRef.current) return null;

      destinationMarkerRef.current?.setLngLat(destination.center).addTo(map);
      destinationCoordsRef.current = destination.center;

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination.center[0]},${destination.center[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
        );
        const data = await res.json();
        const route = data?.routes?.[0];
        if (!route) return null;

        const coordinates = smoothRouteCoordinates(
          route.geometry.coordinates as [number, number][],
        );
        const routeFeature: GeoJSON.Feature = {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        };
        routeDataRef.current = routeFeature;
        routeCoordsRef.current = coordinates;
        const meta = buildRouteMeta(coordinates);
        routeSegmentLengthsRef.current = meta.segmentLengths;
        routeTotalLengthRef.current = meta.total;
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
      if (!mapReadyRef.current) return;
      stopJourneyLoop();
      const map = mapRef.current;
      map?.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
      destinationMarkerRef.current?.remove();
      vehicleMarkerRef.current?.remove();
      vehicleMarkerRef.current = null;
      destinationCoordsRef.current = null;
      routeDataRef.current = null;
      routeCoordsRef.current = [];
      routeSegmentLengthsRef.current = [];
      routeTotalLengthRef.current = 0;
      const source = map?.getSource(ROUTE_SOURCE_ID) as
        mapboxgl.GeoJSONSource | undefined;
      source?.setData({ type: "FeatureCollection", features: [] });
    },
    beginJourney(vehicle, startedAt, totalDurationMs) {
      const map = mapRef.current;
      const start = routeCoordsRef.current[0];
      if (!map || !start) return;

      stopJourneyLoop();
      destinationMarkerRef.current?.remove();
      vehicleMarkerRef.current?.remove();

      const el = document.createElement("div");
      el.className = "focus-vehicle-marker";
      const img = document.createElement("img");
      img.src = getVehicleOption(vehicle).markerImage;
      img.alt = "";
      el.appendChild(img);

      vehicleMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(start)
        .addTo(map);

      map.setPadding(JOURNEY_PADDING);
      const center = map.getCenter();
      cameraStateRef.current = {
        lng: center.lng,
        lat: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      };
      lastProgressReportRef.current = 0;
      userControllingCameraRef.current = false;
      journeyRef.current = { startedAt, totalDurationMs };
      journeyRafRef.current = requestAnimationFrame(runJourneyLoop);
    },
    endJourney() {
      stopJourneyLoop();
      vehicleMarkerRef.current?.remove();
      vehicleMarkerRef.current = null;
    },
    setLabelMode(mode) {
      labelModeRef.current = mode;
      const map = mapRef.current;
      if (map && mapReadyRef.current) applyLabelMode(map, mode);
    },
    zoomToCurrentLocation() {
      const map = mapRef.current;
      const coords = currentCoordsRef.current;
      if (!map || !coords || !mapReadyRef.current) return;
      map.flyTo({ center: coords, zoom: 7, duration: 1200 });
    },
    resetToStart() {
      const map = mapRef.current;
      const coords = currentCoordsRef.current;
      if (!map || !coords || !mapReadyRef.current) return;
      map.flyTo({ center: coords, zoom: START_ZOOM, duration: 1200 });
    },
    setCurrentLocation(coords) {
      currentCoordsRef.current = coords;
      const map = mapRef.current;
      if (map) markerRef.current?.setLngLat(coords).addTo(map);
      if (map && mapReadyRef.current && !hasInitialCenteredRef.current) {
        hasInitialCenteredRef.current = true;
        map.flyTo({ center: coords, zoom: START_ZOOM, duration: 1200 });
      }
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

      <MapLoader
        visible={!mapReady || locatingSavedLocation}
        label={!mapReady ? "Loading map…" : "Finding your location…"}
      />
    </div>
  );
});
