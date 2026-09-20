import SectionBadge from "@/components/landing/section-badge";
import Image from "next/image";
import {
  Flag,
  History,
  MapPin,
  Milestone,
  Play,
  Route,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Cell = {
  body: React.ReactNode;
  icon: LucideIcon;
  /** Blob colour from the hero shapes, so the grid reads as the same set. */
  color: string;
  title: string;
  subtitle: string;
  featured?: boolean;
};

const CELLS: Record<
  "coreIdea" | "checkpoints" | "phases" | "chain" | "notATimer",
  Cell
> = {
  coreIdea: {
    featured: true,
    icon: Route,
    color: "#3CB878",
    title: "The core idea",
    subtitle: "Time becomes distance",
    body: (
      <>
        <p>
          A typical focus app tells you <Mono>45 minutes remaining</Mono>.
          FocusJourney tells you <Mono>32 km until arrival</Mono>.
        </p>
        <p className="mt-4">
          The timer still drives the session underneath. You just experience it
          as movement: a starting point, a virtual road, checkpoints along the
          way, and a destination you actually reach.
        </p>
      </>
    ),
  },
  checkpoints: {
    icon: Milestone,
    color: "#F5C63D",
    title: "Checkpoints and ETA",
    subtitle: "Progress you can see",
    body: (
      <p>
        Every session has a live ETA and checkpoints on the route, so a long
        stretch of deep work breaks into visible milestones instead of a
        countdown.
      </p>
    ),
  },
  phases: {
    icon: Flag,
    color: "#FF5B36",
    title: "Journey phases",
    subtitle: "Start · Move · Progress · Arrive",
    body: (
      <p>
        A session is not a bar that fills up. You depart, you travel, you pass
        landmarks, and you arrive. Finishing feels like reaching somewhere.
      </p>
    ),
  },
  chain: {
    icon: History,
    color: "#E4C9A0",
    title: "Travel history",
    subtitle: "Where you have been",
    body: (
      <>
        <p>
          Your first journey starts from your detected location. When you
          arrive, that destination becomes your new current location, and the
          next session departs from there.
        </p>
        <p className="mt-4">
          <Mono>Delhi → Jaipur</Mono>, then <Mono>Jaipur → Ajmer</Mono>. Every
          completed session is saved, so your focus history reads like a travel
          log.
        </p>
      </>
    ),
  },
  notATimer: {
    icon: Timer,
    color: "#4FB6E8",
    title: "Not a Pomodoro clone",
    subtitle: "A travel experience",
    body: (
      <p>
        Most focus apps reduce productivity to a timer. FocusJourney uses a
        road-trip metaphor for a stronger sense of movement, progress, and
        arrival.
      </p>
    ),
  },
};

export default function ConceptBento() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-7xl px-4 py-20 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <SectionBadge>How it works</SectionBadge>
        <h2 className="font-heading mt-4 text-3xl leading-[1.05] font-bold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
          A focus session you can finish
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          FocusJourney turns time spent focusing into a journey from a starting
          point to a destination. Here is what that means.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:mt-20 md:h-[880px] md:grid-cols-3">
        <div className="grid gap-5 md:grid-rows-[3fr_2fr]">
          <BentoCard cell={CELLS.coreIdea} />
          <BentoCard cell={CELLS.checkpoints} />
        </div>
        <div className="grid gap-5 md:grid-rows-[2fr_3fr]">
          <BentoCard cell={CELLS.phases} />
          <BentoCard cell={CELLS.chain} />
        </div>
        <div className="grid gap-5 md:grid-rows-[2fr_3fr]">
          <BentoCard cell={CELLS.notATimer} />
          <PreviewCard />
        </div>
      </div>
    </section>
  );
}

function BentoCard({ cell }: { cell: Cell }) {
  const Icon = cell.icon;
  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-3xl border p-7 md:p-8",
        cell.featured
          ? "border-neutral-200 bg-white shadow-xl shadow-neutral-200/60 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
          : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900",
      )}
    >
      <div className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        {cell.body}
      </div>
      <div className="mt-10 flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-900 text-neutral-900 drop-shadow-sm"
          style={{ backgroundColor: cell.color }}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {cell.title}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {cell.subtitle}
          </p>
        </div>
      </div>
    </article>
  );
}

function PreviewCard() {
  return (
    <a
      href="#hero-preview"
      className="group relative block min-h-[360px] overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800"
      aria-label="Watch the FocusJourney preview"
    >
      <Image
        src="/hero2.png"
        alt="A car driving along a coastal road toward a destination"
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 py-2.5 pr-5 pl-3 text-sm font-medium text-white shadow-lg backdrop-blur-md">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-900">
            <Play className="ml-0.5 size-4" fill="currentColor" />
          </span>
          Watch preview
        </span>
      </div>
      <span className="absolute top-5 left-5 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
        <MapPin className="size-3" />
        Start → Move → Progress → Arrive
      </span>
    </a>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[13px] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
      {children}
    </code>
  );
}
