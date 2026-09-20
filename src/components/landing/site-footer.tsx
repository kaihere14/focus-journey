import Image from "next/image";
import Link from "next/link";
import { CircleCheckBig, MoreVertical, Paperclip } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Start a journey", href: "/home" },
  { label: "Travel anywhere", href: "#travel" },
  { label: "How it works", href: "#how-it-works" },
  {
    label: "GitHub",
    href: "https://github.com/kaihere14/focus-journey",
    external: true,
  },
];

const JOURNEY_STEPS = ["Start", "Move", "Progress", "Arrive"];

const VEHICLES = [
  { src: "/vehicles/car.webp", alt: "Car", color: "#4FB6E8", rotate: -10 },
  {
    src: "/vehicles/motorcycle.webp",
    alt: "Motorcycle",
    color: "#F5C63D",
    rotate: 2,
  },
  { src: "/vehicles/truck.webp", alt: "Truck", color: "#FF5B36", rotate: 12 },
];

const HISTORY = [
  { from: "Delhi", to: "Jaipur", meta: "Arrived · 45 min" },
  { from: "Jaipur", to: "Ajmer", meta: "Arrived · 1h 7m" },
];

export default function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pt-8 pb-6">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 bg-[radial-gradient(circle,_#d4d4d4_1px,_transparent_1px)] bg-[size:18px_18px] px-6 pt-10 pb-24 md:px-12 md:pt-14 md:pb-32 dark:border-neutral-800 dark:bg-neutral-950 dark:bg-[radial-gradient(circle,_#333_1px,_transparent_1px)]">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full">
            <Image src="/logo.png" height={360} width={360} alt="logo" />
          </div>
          <span className="font-heading text-lg font-bold text-neutral-900 dark:text-white">
            FocusJourney
          </span>
        </div>

        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_auto] md:gap-16">
          <h2 className="font-heading max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
            Turn time spent focusing into a journey you can complete.
          </h2>

          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                Product
              </p>
              <ul className="mt-4 space-y-3">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                Journey
              </p>
              <ul className="mt-4 space-y-3 text-neutral-600 dark:text-neutral-400">
                {JOURNEY_STEPS.map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-400">
                      0{i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-20 flex flex-col items-center gap-3 text-xs text-neutral-500 md:mt-32 md:flex-row md:justify-center md:gap-6 dark:text-neutral-400">
          <span>© {new Date().getFullYear()} FocusJourney</span>
          <a
            href="https://github.com/kaihere14/focus-journey"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.26 5.69.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z" />
            </svg>
          </a>
        </div>

        <VehicleFolder />
        <HistoryFolder />
      </div>
    </footer>
  );
}

/* Tilted "folder" card, bottom-left: the vehicles you can drive. */
function VehicleFolder() {
  return (
    <div className="pointer-events-none absolute -bottom-8 left-2 hidden w-[340px] -rotate-6 origin-bottom-left select-none md:block">
      <div className="ml-2 h-7 w-40 rounded-t-2xl border border-b-0 border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900" />
      <div className="relative h-[210px] rounded-2xl rounded-tl-none border border-neutral-200 bg-white p-6 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)] dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
          Pick your ride
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Car, motorcycle, or truck
        </p>
        <div className="absolute bottom-5 left-6 flex items-end">
          {VEHICLES.map((v, i) => (
            <div
              key={v.alt}
              className="flex size-20 items-center justify-center rounded-2xl border-2 border-neutral-900 shadow-lg"
              style={{
                backgroundColor: v.color,
                transform: `rotate(${v.rotate}deg)`,
                marginLeft: i === 0 ? 0 : -14,
              }}
            >
              <Image
                src={v.src}
                alt={v.alt}
                width={80}
                height={160}
                className="h-16 w-auto rotate-90 drop-shadow"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Tilted "folder" card, bottom-right: completed journeys, chained. */
function HistoryFolder() {
  return (
    <div className="pointer-events-none absolute right-2 -bottom-6 hidden w-[360px] rotate-6 origin-bottom-right select-none md:block">
      <Paperclip
        className="absolute -top-6 left-6 z-10 size-10 -rotate-12 text-neutral-400"
        strokeWidth={1.5}
      />
      <div className="ml-2 h-7 w-44 rounded-t-2xl border border-b-0 border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900" />
      <div className="space-y-3 rounded-2xl rounded-tl-none border border-neutral-200 bg-white p-5 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)] dark:border-neutral-700 dark:bg-neutral-900">
        <p className="px-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">
          Travel history
        </p>
        {HISTORY.map((h) => (
          <div
            key={h.to}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-[#4FB6E8] text-xs font-bold text-white">
              {h.to.slice(0, 2).toUpperCase()}
              <CircleCheckBig
                className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full bg-white p-0.5 text-[#3CB878]"
                strokeWidth={3}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {h.from} → {h.to}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {h.meta}
              </p>
            </div>
            <MoreVertical className="size-4 text-neutral-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
