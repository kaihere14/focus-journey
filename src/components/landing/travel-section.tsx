"use client";

import SectionBadge from "@/components/landing/section-badge";
import { motion } from "framer-motion";
import {
  WORLD_DOTS,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
} from "@/components/landing/world-dots";

// Pins are projected with the same dotted-map instance as WORLD_DOTS, so they
// land on the right dots. Order matters: each stop is the next journey's start.
const STOPS = [
  { name: "San Francisco", x: 16, y: 21.65 },
  { name: "New York", x: 33.5, y: 20.78 },
  { name: "Lagos", x: 61, y: 33.77 },
  { name: "Delhi", x: 86.5, y: 25.98 },
  { name: "Tokyo", x: 108.5, y: 22.52 },
] as const;

const ROUTE_COLOR = "#4FB6E8";
const ARRIVAL_COLOR = "#3CB878";

function arc(from: { x: number; y: number }, to: { x: number; y: number }) {
  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - Math.abs(to.x - from.x) * 0.22;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

export default function TravelSection() {
  return (
    <section
      id="travel"
      className="mx-auto w-full max-w-7xl px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <SectionBadge>Travel</SectionBadge>
        <h2 className="font-heading mt-4 text-3xl leading-[1.05] font-bold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
          Study here. Arrive anywhere.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Every focus session is a journey from where you are to where you are
          headed. Finish one, and its destination becomes the start of your
          next.
        </p>
      </div>

      <WorldRoute />

      <div className="mt-6 text-center md:mt-10">
        <p
          className="font-heading text-4xl font-bold tracking-tight md:text-5xl"
          style={{ color: ARRIVAL_COLOR }}
        >
          32 km until arrival
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Not &ldquo;45 minutes remaining&rdquo;. Time you spend focusing
          becomes distance you travel.
        </p>
      </div>
    </section>
  );
}

function WorldRoute() {
  const legs = STOPS.slice(1).map((to, i) => ({
    d: arc(STOPS[i], to),
    key: `${STOPS[i].name}-${to.name}`,
  }));

  return (
    <div className="relative mx-auto mt-10 w-full max-w-5xl md:mt-16">
      <svg
        viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
        className="h-auto w-full text-neutral-300 select-none dark:text-neutral-700"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="travel-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={ROUTE_COLOR} stopOpacity="0" />
            <stop offset="0.12" stopColor={ROUTE_COLOR} />
            <stop offset="0.88" stopColor={ROUTE_COLOR} />
            <stop offset="1" stopColor={ROUTE_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        {WORLD_DOTS.map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={0.28}
            fill="currentColor"
          />
        ))}

        {legs.map((leg, i) => (
          <motion.path
            key={leg.key}
            d={leg.d}
            fill="none"
            stroke="url(#travel-route)"
            strokeWidth={0.32}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 1.1,
              delay: 0.3 + i * 0.55,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {STOPS.map((stop, i) => {
        const isLast = i === STOPS.length - 1;
        const color = isLast ? ARRIVAL_COLOR : ROUTE_COLOR;
        return (
          <motion.div
            key={stop.name}
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 md:size-4"
            style={{
              left: `${(stop.x / WORLD_MAP_WIDTH) * 100}%`,
              top: `${(stop.y / WORLD_MAP_HEIGHT) * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.55 }}
          >
            {isLast && (
              <span
                className="absolute inset-0 animate-ping rounded-full opacity-40"
                style={{ backgroundColor: color }}
              />
            )}
            <span
              className="absolute inset-0.5 rounded-full ring-2 ring-white dark:ring-neutral-950"
              style={{ backgroundColor: color }}
            />
            <span className="absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-neutral-700 shadow-sm md:block dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              {stop.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
