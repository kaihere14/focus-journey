"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import {
  FocusMap,
  type FocusMapHandle,
  type JourneyDestination,
  type RouteSummary,
} from "@/components/map/focus-map";
import { DestinationSearch } from "@/components/map/destination-search";
import { JourneyPanel } from "@/components/map/journey-panel";
import { AnalyticsPanel } from "@/components/map/analytics-panel";
import { VehicleSelector } from "@/components/map/vehicle-selector";
import { ResumeSessionModal } from "@/components/map/resume-session-modal";
import {
  DEFAULT_VEHICLE,
  getVehicleOption,
  vehicleEnumToKey,
  type VehicleEnum,
  type VehicleKey,
} from "@/config/vehicles";
import { JourneyAudioControl } from "@/components/map/journey-audio-control";
import {
  playJourneyStartSound,
  startJourneyAmbience,
  stopJourneyAmbience,
} from "@/lib/journey-sound";

function getGreeting(hour: number) {
  if (hour < 5) return "Good night!";
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  if (hour < 21) return "Good evening!";
  return "Good night!";
}

type JourneyStep = "idle" | "searching" | "previewing" | "active";

type CurrentLocation = {
  lat: number;
  lng: number;
  name: string | null;
};

type ActiveSession = {
  activeTravelHistoryId: string;
  startedAt: number;
  totalDurationMs: number;
  distanceKm: number;
};

type SessionProgress = {
  progress: number;
  remainingMs: number;
};

type JourneyError = {
  type: "start" | "finish" | "exit";
  message: string;
};

type PendingResume = {
  id: string;
  fromLatitude: number;
  fromLongitude: number;
  fromLocationName: string;
  toLatitude: number;
  toLongitude: number;
  toLocationName: string;
  vehicle: VehicleEnum;
  distance: number;
  startedAt: string;
  plannedDurationSec: number | null;
};

function formatRemainingTime(ms: number) {
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatRemainingDistance(totalKm: number, progress: number) {
  const remainingKm = Math.max(0, totalKm * (1 - progress));
  return `${Math.round(remainingKm).toLocaleString()} km`;
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [greeting] = useState(() => getGreeting(new Date().getHours()));
  const [city, setCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [step, setStep] = useState<JourneyStep>("idle");
  const [destination, setDestination] = useState<JourneyDestination | null>(
    null,
  );
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [vehicle, setVehicle] = useState<VehicleKey>(DEFAULT_VEHICLE);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionProgress, setSessionProgress] =
    useState<SessionProgress | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);
  const [journeyError, setJourneyError] = useState<JourneyError | null>(null);
  const [autoLocate, setAutoLocate] = useState(false);
  const [locatingSavedLocation, setLocatingSavedLocation] = useState(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [checkingActiveSession, setCheckingActiveSession] = useState(true);
  const [pendingResume, setPendingResume] = useState<PendingResume | null>(
    null,
  );
  const [resumeBusy, setResumeBusy] = useState(false);
  const mapRef = useRef<FocusMapHandle>(null);
  const hasDbLocationRef = useRef(false);
  const locationInitRef = useRef(false);
  const completionHandledRef = useRef(false);
  const startingRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // FocusJourney's continuous-travel concept treats the database's stored
  // User location as the source of truth for where the next journey starts.
  // Browser geolocation only ever bootstraps that value once, on first use.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/location");
        if (!res.ok || cancelled) return;
        const data: {
          latitude: number | null;
          longitude: number | null;
          locationName: string | null;
        } = await res.json();
        if (data.latitude !== null && data.longitude !== null) {
          hasDbLocationRef.current = true;
          setCurrentLocation({
            lat: data.latitude,
            lng: data.longitude,
            name: data.locationName,
          });
          setCity(data.locationName);
          setCoords([data.longitude, data.latitude]);
          mapRef.current?.setCurrentLocation([data.longitude, data.latitude]);
          mapRef.current?.resetToStart();
        } else if (!cancelled) {
          setAutoLocate(true);
        }
      } catch {
        if (!cancelled) setAutoLocate(true);
      } finally {
        if (!cancelled) setLocatingSavedLocation(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A refresh, crash, or closed tab leaves the started-but-never-finalized
  // TravelHistory row behind as ACTIVE. Surface it so the user can resume
  // or explicitly quit it — a new journey must never start on top of one
  // that's still open, since that would orphan the old row for good.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/travel-history/active");
        if (!res.ok || cancelled) return;
        const data: { travelHistory: PendingResume | null } = await res.json();
        if (data.travelHistory) setPendingResume(data.travelHistory);
      } catch {
        // Fail open: if the check errors, don't block the user from
        // starting a journey. Worst case an orphaned ACTIVE row lingers,
        // same as before this feature existed.
      } finally {
        if (!cancelled) setCheckingActiveSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleContinueResume() {
    if (!pendingResume || resumeBusy) return;
    setResumeBusy(true);

    const origin: [number, number] = [
      pendingResume.fromLongitude,
      pendingResume.fromLatitude,
    ];
    const vehicleKey = vehicleEnumToKey(pendingResume.vehicle);
    const destination: JourneyDestination = {
      name: pendingResume.toLocationName,
      placeName: pendingResume.toLocationName,
      center: [pendingResume.toLongitude, pendingResume.toLatitude],
    };
    const startedAt = new Date(pendingResume.startedAt).getTime();
    const totalDurationMs =
      Math.max(1, pendingResume.plannedDurationSec ?? 0) * 1000;

    setCurrentLocation({
      lat: pendingResume.fromLatitude,
      lng: pendingResume.fromLongitude,
      name: pendingResume.fromLocationName,
    });
    setCity(pendingResume.fromLocationName);
    setCoords(origin);
    hasDbLocationRef.current = true;
    mapRef.current?.setCurrentLocation(origin);

    await mapRef.current?.showRoute(
      destination,
      getVehicleOption(vehicleKey).profile,
      origin,
    );

    completionHandledRef.current = false;
    startJourneyAmbience(vehicleKey);
    mapRef.current?.beginJourney(vehicleKey, startedAt, totalDurationMs);
    setVehicle(vehicleKey);
    setDestination(destination);
    setSession({
      activeTravelHistoryId: pendingResume.id,
      startedAt,
      totalDurationMs,
      distanceKm: pendingResume.distance / 1000,
    });
    const elapsed = Date.now() - startedAt;
    setSessionProgress({
      progress: Math.min(1, Math.max(0, elapsed / totalDurationMs)),
      remainingMs: Math.max(0, totalDurationMs - elapsed),
    });
    setStep("active");
    setPendingResume(null);
    setResumeBusy(false);
  }

  async function handleQuitResume() {
    if (!pendingResume || resumeBusy) return;
    setResumeBusy(true);
    const elapsedSeconds = Math.max(
      0,
      Math.round(
        (Date.now() - new Date(pendingResume.startedAt).getTime()) / 1000,
      ),
    );

    try {
      await fetch(`/api/travel-history/${pendingResume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSeconds: elapsedSeconds,
          completed: false,
        }),
      });
    } finally {
      setPendingResume(null);
      setResumeBusy(false);
    }
  }

  function handleJourneyProgress(progress: number) {
    if (!session) return;
    const remainingMs = Math.round(session.totalDurationMs * (1 - progress));
    setSessionProgress({ progress, remainingMs });
    if (progress >= 1) {
      stopJourneyAmbience();
      if (!completionHandledRef.current) {
        completionHandledRef.current = true;
        void completeJourney();
      }
    }
  }

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  async function handleSelectDestination(next: JourneyDestination) {
    setDestination(next);
    setJourneyError(null);
    setStep("previewing");
    const origin = currentLocation
      ? ([currentLocation.lng, currentLocation.lat] as [number, number])
      : undefined;
    const summary = await mapRef.current?.showRoute(
      next,
      getVehicleOption(vehicle).profile,
      origin,
    );
    setRoute(summary ?? null);
  }

  async function handleVehicleChange(next: VehicleKey) {
    setVehicle(next);
    if (!destination) return;
    const origin = currentLocation
      ? ([currentLocation.lng, currentLocation.lat] as [number, number])
      : undefined;
    const summary = await mapRef.current?.showRoute(
      destination,
      getVehicleOption(next).profile,
      origin,
    );
    setRoute(summary ?? null);
  }

  async function handleBeginJourney() {
    if (!destination || !route || !currentLocation || startingRef.current)
      return;
    startingRef.current = true;
    setStartingJourney(true);
    setJourneyError(null);

    const startedAtDate = new Date();
    const distanceMeters = Math.round(route.distanceKm * 1000);

    try {
      const res = await fetch("/api/travel-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLatitude: currentLocation.lat,
          fromLongitude: currentLocation.lng,
          fromLocationName: currentLocation.name ?? "Current location",
          toLatitude: destination.center[1],
          toLongitude: destination.center[0],
          toLocationName: destination.name,
          vehicle,
          distance: distanceMeters,
          startedAt: startedAtDate.toISOString(),
          plannedDurationSeconds: Math.max(1, route.durationMin) * 60,
        }),
      });
      if (!res.ok) throw new Error("Failed to start journey");
      const data: { id: string } = await res.json();

      const startedAt = startedAtDate.getTime();
      const totalDurationMs = Math.max(1, route.durationMin) * 60 * 1000;
      completionHandledRef.current = false;
      playJourneyStartSound(vehicle);
      startJourneyAmbience(vehicle);
      mapRef.current?.beginJourney(vehicle, startedAt, totalDurationMs);
      setSession({
        activeTravelHistoryId: data.id,
        startedAt,
        totalDurationMs,
        distanceKm: route.distanceKm,
      });
      setSessionProgress({ progress: 0, remainingMs: totalDurationMs });
      setStep("active");
    } catch {
      setJourneyError({
        type: "start",
        message: "Couldn't start the journey. Please try again.",
      });
    } finally {
      startingRef.current = false;
      setStartingJourney(false);
    }
  }

  async function completeJourney() {
    if (!session) return;
    setFinishing(true);
    setJourneyError(null);
    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - session.startedAt) / 1000),
    );

    try {
      const res = await fetch(
        `/api/travel-history/${session.activeTravelHistoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            durationSeconds: elapsedSeconds,
            completed: true,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to complete journey");
      const data: {
        travelHistory: {
          toLatitude: number;
          toLongitude: number;
          toLocationName: string;
        };
      } = await res.json();

      const arrived = data.travelHistory;
      setCurrentLocation({
        lat: arrived.toLatitude,
        lng: arrived.toLongitude,
        name: arrived.toLocationName,
      });
      setCity(arrived.toLocationName);
      setCoords([arrived.toLongitude, arrived.toLatitude]);
      hasDbLocationRef.current = true;
      mapRef.current?.setCurrentLocation([
        arrived.toLongitude,
        arrived.toLatitude,
      ]);
      resetToIdle();
    } catch {
      completionHandledRef.current = false;
      setJourneyError({
        type: "finish",
        message: "Couldn't save your completed journey.",
      });
    } finally {
      setFinishing(false);
    }
  }

  async function handleExitJourney() {
    if (!session || finishing) return;
    setFinishing(true);
    setJourneyError(null);
    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - session.startedAt) / 1000),
    );

    try {
      const res = await fetch(
        `/api/travel-history/${session.activeTravelHistoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            durationSeconds: elapsedSeconds,
            completed: false,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to exit journey");
      resetToIdle();
    } catch {
      setJourneyError({
        type: "exit",
        message: "Couldn't save your exit. Please try again.",
      });
    } finally {
      setFinishing(false);
    }
  }

  function resetToIdle() {
    stopJourneyAmbience();
    mapRef.current?.endJourney();
    mapRef.current?.clearRoute();
    mapRef.current?.resetToStart();
    completionHandledRef.current = false;
    setDestination(null);
    setRoute(null);
    setVehicle(DEFAULT_VEHICLE);
    setSession(null);
    setSessionProgress(null);
    setJourneyError(null);
    setStep("idle");
  }

  function handleClosePreview() {
    stopJourneyAmbience();
    mapRef.current?.clearRoute();
    mapRef.current?.resetToStart();
    setDestination(null);
    setRoute(null);
    setVehicle(DEFAULT_VEHICLE);
    setJourneyError(null);
    setStep("idle");
  }

  return (
    <main style={{ position: "fixed", inset: 0 }} className="bg-black">
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        <FocusMap
          ref={mapRef}
          autoLocate={autoLocate}
          locatingSavedLocation={locatingSavedLocation}
          onLocationChange={(nextCity, nextCoords) => {
            if (hasDbLocationRef.current) return;
            setCity(nextCity);
            setCoords(nextCoords);
            if (nextCoords && !locationInitRef.current) {
              locationInitRef.current = true;
              fetch("/api/user/location", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  latitude: nextCoords[1],
                  longitude: nextCoords[0],
                  locationName: nextCity ?? "Current location",
                }),
              })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                  if (data?.latitude != null && data?.longitude != null) {
                    hasDbLocationRef.current = true;
                    setCurrentLocation({
                      lat: data.latitude,
                      lng: data.longitude,
                      name: data.locationName,
                    });
                  }
                })
                .catch(() => {});
            }
          }}
          onJourneyProgress={handleJourneyProgress}
        />

        {step !== "active" && (
          <div className="pointer-events-none absolute top-0 left-0 p-6">
            <p className="text-sm font-medium text-white/70 drop-shadow-sm">
              {greeting}
            </p>
            <p className="text-2xl font-semibold text-white drop-shadow-sm">
              {city ?? "Locating…"}
            </p>
          </div>
        )}

        <div className="pointer-events-auto absolute top-4 right-4 flex items-center gap-2">
          {step === "active" && <JourneyAudioControl />}
          {step === "active" && (
            <button
              type="button"
              aria-label="Exit journey"
              title="Exit journey"
              onClick={handleExitJourney}
              disabled={finishing}
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white disabled:opacity-50"
            >
              {finishing ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <X className="size-4" strokeWidth={1.75} />
              )}
            </button>
          )}
          <div className="rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
            <UserButton
              appearance={{
                elements: { avatarBox: "size-7" },
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {step === "searching" && (
            <DestinationSearch
              proximity={
                currentLocation
                  ? [currentLocation.lng, currentLocation.lat]
                  : coords
              }
              onSelect={handleSelectDestination}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === "previewing" && destination && (
            <div className="pointer-events-none absolute bottom-6 left-6 flex w-[calc(100%-3rem)] max-w-sm flex-col items-end gap-3">
              <VehicleSelector
                selected={vehicle}
                onSelect={handleVehicleChange}
              />
              <JourneyPanel
                className="w-full"
                destination={destination}
                route={route}
                onClose={handleClosePreview}
                onBeginJourney={handleBeginJourney}
                starting={startingJourney}
              />
              {journeyError?.type === "start" && (
                <p className="pointer-events-auto w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2 text-center text-xs text-red-300 backdrop-blur-xl">
                  {journeyError.message}
                </p>
              )}
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === "active" && session && sessionProgress && (
            <motion.div
              key="active-journey-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="pointer-events-none absolute bottom-6 left-6">
                <p className="text-xs font-medium tracking-wide text-white/60">
                  Time Remaining
                </p>
                <p className="text-2xl font-semibold text-white drop-shadow-sm">
                  {formatRemainingTime(sessionProgress.remainingMs)}
                </p>
              </div>

              <div className="pointer-events-none absolute right-6 bottom-6 text-right">
                <p className="text-xs font-medium tracking-wide text-white/60">
                  Distance Remaining
                </p>
                <p className="text-2xl font-semibold text-white drop-shadow-sm">
                  {formatRemainingDistance(
                    session.distanceKm,
                    sessionProgress.progress,
                  )}
                </p>
              </div>

              {journeyError && (
                <div className="pointer-events-auto absolute bottom-24 left-1/2 flex w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 flex-col items-center gap-2 rounded-2xl border border-white/15 bg-black/50 p-4 text-center backdrop-blur-xl">
                  <p className="text-sm text-white/80">
                    {journeyError.message}
                  </p>
                  <button
                    type="button"
                    disabled={finishing}
                    onClick={() =>
                      journeyError.type === "exit"
                        ? handleExitJourney()
                        : completeJourney()
                    }
                    className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black shadow-lg disabled:opacity-50"
                  >
                    {finishing ? "Retrying…" : "Retry"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {step === "idle" &&
          !isAnalyticsOpen &&
          !checkingActiveSession &&
          !pendingResume && (
            <div className="pointer-events-none absolute bottom-8 left-6 flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => {
                  mapRef.current?.zoomToCurrentLocation();
                  setStep("searching");
                }}
                className="pointer-events-auto rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Journey
              </button>
              <button
                type="button"
                onClick={() => setIsAnalyticsOpen(true)}
                className="pointer-events-auto rounded-full border border-white/15 bg-black/35 px-6 py-2 text-xs font-medium text-white/75 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-white"
              >
                Analytics
              </button>
            </div>
          )}

        <AnimatePresence>
          {step === "idle" && isAnalyticsOpen && (
            <AnalyticsPanel onClose={() => setIsAnalyticsOpen(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingResume && (
            <ResumeSessionModal
              toLocationName={pendingResume.toLocationName}
              onContinue={handleContinueResume}
              onQuit={handleQuitResume}
              busy={resumeBusy}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
