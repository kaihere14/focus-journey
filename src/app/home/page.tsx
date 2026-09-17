"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { AnimatePresence } from "framer-motion";
import {
  FocusMap,
  type FocusMapHandle,
  type JourneyDestination,
  type RouteSummary,
} from "@/components/map/focus-map";
import { DestinationSearch } from "@/components/map/destination-search";
import { JourneyPanel } from "@/components/map/journey-panel";

function getGreeting(hour: number) {
  if (hour < 5) return "Good night!";
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  if (hour < 21) return "Good evening!";
  return "Good night!";
}

type JourneyStep = "idle" | "searching" | "previewing";

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
  const mapRef = useRef<FocusMapHandle>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  async function handleSelectDestination(next: JourneyDestination) {
    setDestination(next);
    setStep("previewing");
    const summary = await mapRef.current?.showRoute(next);
    setRoute(summary ?? null);
  }

  function handleClosePreview() {
    mapRef.current?.clearRoute();
    setDestination(null);
    setRoute(null);
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
        />

        <div className="pointer-events-none absolute top-0 left-0 p-6">
          <p className="text-sm font-medium text-white/70 drop-shadow-sm">
            {greeting}
          </p>
          <p className="text-2xl font-semibold text-white drop-shadow-sm">
            {city ?? "Locating…"}
          </p>
        </div>

        <div className="pointer-events-auto absolute top-4 right-4 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
          <UserButton
            appearance={{
              elements: { avatarBox: "size-7" },
            }}
          />
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
            <JourneyPanel
              destination={destination}
              route={route}
              onClose={handleClosePreview}
              onBeginJourney={() => {}}
            />
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
