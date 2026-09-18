"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  FocusMap,
  type FocusMapHandle,
  type JourneyDestination,
  type RouteSummary,
} from "@/components/map/focus-map";
import { DestinationSearch } from "@/components/map/destination-search";
import { JourneyPanel } from "@/components/map/journey-panel";
import { VehicleSelector } from "@/components/map/vehicle-selector";
import {
  DEFAULT_VEHICLE,
  getVehicleOption,
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

type ActiveSession = {
  startedAt: number;
  totalDurationMs: number;
  distanceKm: number;
};

type SessionProgress = {
  progress: number;
  remainingMs: number;
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
  const [step, setStep] = useState<JourneyStep>("idle");
  const [destination, setDestination] = useState<JourneyDestination | null>(
    null,
  );
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [vehicle, setVehicle] = useState<VehicleKey>(DEFAULT_VEHICLE);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionProgress, setSessionProgress] =
    useState<SessionProgress | null>(null);
  const mapRef = useRef<FocusMapHandle>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  function handleJourneyProgress(progress: number) {
    if (!session) return;
    const remainingMs = Math.round(session.totalDurationMs * (1 - progress));
    setSessionProgress({ progress, remainingMs });
    if (progress >= 1) stopJourneyAmbience();
  }

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  async function handleSelectDestination(next: JourneyDestination) {
    setDestination(next);
    setStep("previewing");
    const summary = await mapRef.current?.showRoute(
      next,
      getVehicleOption(vehicle).profile,
    );
    setRoute(summary ?? null);
  }

  async function handleVehicleChange(next: VehicleKey) {
    setVehicle(next);
    if (!destination) return;
    const summary = await mapRef.current?.showRoute(
      destination,
      getVehicleOption(next).profile,
    );
    setRoute(summary ?? null);
  }

  function handleBeginJourney() {
    if (!destination || !route) return;
    const startedAt = Date.now();
    const totalDurationMs = Math.max(1, route.durationMin) * 60 * 1000;
    playJourneyStartSound(vehicle);
    startJourneyAmbience(vehicle);
    mapRef.current?.beginJourney(vehicle, startedAt, totalDurationMs);
    setSession({ startedAt, totalDurationMs, distanceKm: route.distanceKm });
    setSessionProgress({ progress: 0, remainingMs: totalDurationMs });
    setStep("active");
  }

  function handleClosePreview() {
    stopJourneyAmbience();
    mapRef.current?.clearRoute();
    mapRef.current?.resetToStart();
    setDestination(null);
    setRoute(null);
    setVehicle(DEFAULT_VEHICLE);
    setStep("idle");
  }

  return (
    <main style={{ position: "fixed", inset: 0 }} className="bg-black">
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        <FocusMap
          ref={mapRef}
          onLocationChange={(nextCity, nextCoords) => {
            setCity(nextCity);
            setCoords(nextCoords);
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
              proximity={coords}
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
              />
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
            </motion.div>
          )}
        </AnimatePresence>

        {step === "idle" && (
          <div className="pointer-events-none absolute bottom-8 left-6">
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
          </div>
        )}
      </div>
    </main>
  );
}
