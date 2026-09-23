"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk, useUser, UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  History,
  House,
  Info,
  MapPin,
  Navigation,
  RotateCcw,
  Route,
  Search,
  Settings,
} from "lucide-react";

export default function HeroSectionOne() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [isStarting, setIsStarting] = useState(false);

  function handleGetStarted() {
    if (isStarting || !isLoaded) return;
    setIsStarting(true);
    if (isSignedIn) {
      router.push("/home");
      return;
    }
    clerk.openSignIn({ forceRedirectUrl: "/home" });
    setTimeout(() => setIsStarting(false), 600);
  }

  return (
    <div className="px-2 pt-2 sm:px-4 sm:pt-4">
      <section className="relative isolate mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-black/5 bg-[#f4f3ee]">
        <HeroBackdrop />

        <Navbar
          onGetStarted={handleGetStarted}
          isSignedIn={!!isLoaded && !!isSignedIn}
        />

        <div className="relative z-10 px-4 pt-14 text-center md:pt-20">
          <h1 className="mx-auto max-w-4xl text-[2.6rem] leading-[1.02] font-medium tracking-[-0.045em] text-neutral-900 sm:text-6xl md:text-7xl">
            Your focus can finally
            <br className="hidden sm:block" /> go somewhere.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-xl">
            FocusJourney is the first focus timer that feels like a{" "}
            <span className="rounded-md bg-amber-200/80 px-1 whitespace-nowrap text-neutral-800">
              road trip
            </span>
            .
            <br className="hidden sm:block" /> Turn deep work into kilometres
            travelled.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleGetStarted}
              disabled={isStarting}
              className="h-12 cursor-pointer rounded-full bg-neutral-900 px-6 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_14px_rgba(0,0,0,0.18)] transition hover:bg-neutral-800 active:translate-y-px disabled:opacity-70"
            >
              {isStarting ? "Starting…" : "Start a journey"}
            </button>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center gap-1.5 rounded-full bg-white/85 px-6 text-base font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
            >
              See how it works
              <ChevronRight className="size-4 text-neutral-500" />
            </a>
          </div>
        </div>

        <HeroShowcase />
      </section>
    </div>
  );
}

// Soft photographic wash: a blurred copy of the hero art fading into the
// cream page colour at the top, like light through tall grass.
const HeroBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-[#eef0e4] via-[#a9bb86] to-[#5b7a3c]" />
    <Image
      src="/hero2.png"
      alt=""
      fill
      loading="eager"
      sizes="100vw"
      className="scale-110 object-cover object-left-bottom opacity-50 mix-blend-soft-light blur-2xl"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#f4f3ee] via-[#f4f3ee]/80 via-40% to-transparent" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.6),transparent_60%)]" />
  </div>
);

const Navbar = ({
  onGetStarted,
  isSignedIn,
}: {
  onGetStarted: () => void;
  isSignedIn: boolean;
}) => (
  <nav className="relative z-20 flex items-center justify-between px-4 py-3 md:px-6">
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        height={360}
        width={360}
        alt="logo"
        className="size-8 rounded-full"
      />
      <span className="text-xl font-medium tracking-tight text-neutral-800">
        focusjourney
      </span>
    </div>

    <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[15px] text-neutral-800 md:flex">
      <a href="#travel" className="transition hover:text-neutral-500">
        Why This Exists
      </a>
      <a href="#how-it-works" className="transition hover:text-neutral-500">
        Features
      </a>
    </div>

    <div className="flex items-center gap-4">
      <a
        href="https://github.com/kaihere14/focus-journey"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub repository"
        className="hidden text-neutral-600 transition hover:text-neutral-900 sm:block"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.26 5.69.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z" />
        </svg>
      </a>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <button
          type="button"
          onClick={onGetStarted}
          className="h-10 cursor-pointer rounded-full bg-neutral-900 px-5 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-neutral-800"
        >
          Get started
        </button>
      )}
    </div>
  </nav>
);

const HeroShowcase = () => (
  <div className="relative z-10 mx-auto mt-12 max-w-6xl px-4 pb-12 md:mt-12 md:px-8 md:pb-12">
    <div className="relative lg:min-h-[580px]">
      <div className="lg:ml-auto lg:w-[64%]">
        <AppWindow />
      </div>
      <div className="relative mt-6 lg:absolute lg:top-[100px] lg:left-0 lg:mt-0 lg:w-[45%]">
        <JourneyLog />
      </div>
    </div>
  </div>
);

const TrafficLights = () => (
  <div className="flex gap-2">
    <span className="size-3 rounded-full bg-[#ff5f57]" />
    <span className="size-3 rounded-full bg-[#febc2e]" />
    <span className="size-3 rounded-full bg-[#28c840]" />
  </div>
);

const LOG_STEPS = [
  {
    icon: "/vehicles/car.webp",
    title: "Picked a vehicle",
    detail: "Car · cruising at 80 km/h",
  },
  {
    icon: "/vehicles/motorcycle.webp",
    title: "Passed a checkpoint",
    detail: "Neemrana · 25 km behind you",
  },
  {
    icon: "/vehicles/truck.webp",
    title: "Arrived in Jaipur",
    detail: "45 minutes of deep work",
  },
];

// Steps: 0 = typing prompt, 1..3 = log rows, 4 = done line.
const JourneyLog = () => {
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [900, 1900, 2900, 3800].map((delay, i) =>
      setTimeout(() => setStep(i + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [run]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full overflow-hidden rounded-2xl bg-[#1f1e1d] text-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/40">
        <div className="relative flex items-center px-4 py-3.5">
          <TrafficLights />
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-sm font-medium text-white/90">
            <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500">
              <Navigation className="size-3 fill-white text-white" />
            </span>
            Journey Log
          </div>
        </div>

        <div className="px-5 pb-6">
          <div className="rounded-xl bg-white/[0.06] px-4 py-4 font-mono text-[15px] tracking-tight ring-1 ring-white/5 md:text-base">
            <span className="text-orange-300">&gt;</span>{" "}
            <span key={run} className="animate-in fade-in duration-700">
              Focus 45 min · Delhi → Jaipur
            </span>
          </div>

          <ul className="mt-4 space-y-4">
            {LOG_STEPS.map((s, i) => {
              const visible = step > i;
              return (
                <li
                  key={s.title}
                  className={`flex items-center gap-3.5 px-1 transition-all duration-500 ${
                    visible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0"
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/90">
                    <Image
                      src={s.icon}
                      alt=""
                      width={64}
                      height={64}
                      className="size-7 rotate-90 object-contain"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] leading-tight font-medium">
                      {s.title}
                    </p>
                    <p className="text-sm text-white/50">{s.detail}</p>
                  </div>
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check
                      className="size-3.5 text-emerald-400"
                      strokeWidth={3}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <p
            className={`mt-5 flex items-center gap-2 px-1 font-mono text-[15px] transition-opacity duration-500 ${
              step > 3 ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="size-2 rounded-full bg-emerald-400" />
            Done. Journey saved to history.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setStep(0);
          setRun((r) => r + 1);
        }}
        className="mt-8 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white/90 px-4 text-base font-medium text-neutral-900 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
      >
        <RotateCcw className="size-4" />
        Replay
      </button>
    </div>
  );
};

const NAV_ITEMS = [
  { icon: House, label: "Home", count: 12, active: true },
  { icon: Route, label: "Journeys", count: 48 },
  { icon: History, label: "History", count: 31 },
];

const ROUTES = [
  { label: "Delhi → Jaipur", count: 9, open: true },
  { label: "Mumbai → Pune", count: 6 },
  { label: "Bangalore → Mysore", count: 4 },
];

const DETAILS: { label: string; value: React.ReactNode }[] = [
  {
    label: "Vehicle",
    value: (
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700 ring-1 ring-neutral-200">
        car
      </code>
    ),
  },
  { label: "Route", value: "Delhi → Jaipur · 60 km" },
  {
    label: "Session",
    value: (
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-emerald-500" />
        45 min focus · 2 checkpoints
      </span>
    ),
  },
  { label: "Arrival", value: "On time" },
];

const AppWindow = () => (
  <div className="overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
    <div className="flex">
      <aside className="hidden w-[180px] shrink-0 flex-col border-r border-neutral-200/80 bg-[#f7f6f3] px-2.5 py-3 text-[12px] text-neutral-700 sm:flex">
        <div className="px-1.5">
          <TrafficLights />
        </div>
        <div className="mt-4 flex items-center gap-2 px-1.5">
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            className="size-6 rounded-full"
          />
          <span className="text-[14px] font-medium text-neutral-900">
            focusjourney
          </span>
        </div>

        <div className="mt-4 flex items-center gap-1.5 rounded-md bg-neutral-200/60 px-2 py-1.5 text-neutral-400">
          <Search className="size-3" />
          Search
          <span className="ml-auto text-[10px]">⌘K</span>
        </div>

        <ul className="mt-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, count, active }) => (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                active ? "bg-neutral-200/70 text-neutral-900" : ""
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              <span className="ml-auto text-[10px] text-neutral-400">
                {count}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 flex items-center gap-1 px-2 text-[11px] font-medium text-neutral-400">
          Routes <ChevronDown className="size-3" />
        </p>
        <ul className="mt-1 space-y-0.5">
          {ROUTES.map(({ label, count, open }) => (
            <li key={label}>
              <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
                <ChevronRight
                  className={`size-3 text-neutral-400 ${open ? "rotate-90" : ""}`}
                />
                <MapPin className="size-3.5 text-emerald-600" />
                <span className="truncate">{label}</span>
                <span className="ml-auto text-[10px] text-neutral-400">
                  {count}
                </span>
              </div>
              {open && (
                <ul className="ml-5 space-y-0.5">
                  <li className="flex items-center gap-2 px-2 py-1.5">
                    <Flag className="size-3.5 text-neutral-500" />
                    Checkpoints
                    <span className="ml-auto text-[10px] text-neutral-400">
                      4
                    </span>
                  </li>
                  <li className="flex items-center gap-2 px-2 py-1.5">
                    <Clock className="size-3.5 text-neutral-500" />
                    Sessions
                    <span className="ml-auto text-[10px] text-neutral-400">
                      5
                    </span>
                  </li>
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-0.5 pt-10">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <BarChart3 className="size-3.5" />
            Analytics
            <span className="ml-auto size-1.5 rounded-full bg-neutral-300" />
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Settings className="size-3.5" />
            Settings
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 px-4 py-3 text-[11px] text-neutral-500">
          <ChevronLeft className="size-3.5" />
          <span>Home</span>
          <span className="text-neutral-300">/</span>
          <span className="truncate font-medium text-neutral-900">
            Delhi · Morning deep work
          </span>
          <div className="ml-auto hidden items-center rounded-full bg-neutral-100 p-0.5 md:flex">
            <span className="rounded-full bg-white px-2.5 py-0.5 font-medium text-neutral-900 shadow-sm">
              Road
            </span>
            <span className="px-2.5 py-0.5">Map</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5 text-neutral-400 md:ml-4">
            <History className="size-3.5" />
            <Info className="size-3.5" />
          </div>
        </div>

        <div className="px-4 md:px-10">
          <div className="rounded-xl bg-neutral-100 p-4 md:p-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-md shadow-sm">
              <Image
                src="/hero2.png"
                alt="FocusJourney road view from Delhi to Jaipur"
                fill
                sizes="(min-width: 1024px) 700px, 100vw"
                className="object-cover"
                preload
              />
              <div className="absolute bottom-3 left-1/2 w-[62%] max-w-[260px] -translate-x-1/2 rounded-lg bg-white/95 p-2.5 text-[10px] shadow-xl ring-1 ring-black/5 backdrop-blur">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="font-medium text-neutral-900">
                    18 km to Jaipur
                  </span>
                  <span>27:40 / 45:00</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full w-[62%] rounded-full bg-emerald-500" />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-orange-500">
                  <Flag className="size-2.5" />
                  Next checkpoint · Shahpura
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-2 mb-3 text-[11px]">
            {DETAILS.map(({ label, value }) => (
              <div
                key={label}
                className="grid grid-cols-[110px_1fr] items-center border-b border-neutral-100 py-2 last:border-0"
              >
                <dt className="text-neutral-400">{label}</dt>
                <dd className="text-neutral-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  </div>
);
