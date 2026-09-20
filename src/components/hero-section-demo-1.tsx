"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk, useUser, UserButton } from "@clerk/nextjs";
import {
  ArrowUpRight,
  ArrowUpLeft,
  Asterisk,
  Cog,
  Flower2,
  Hexagon,
  Key,
  Shield,
  CircleCheckBig,
  Heart,
  Play,
} from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";

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
    <div className="mx-auto flex max-w-7xl flex-col">
      <Navbar
        onGetStarted={handleGetStarted}
        isSignedIn={!!isLoaded && !!isSignedIn}
      />

      <div className="relative overflow-hidden px-4 pt-10 pb-16 md:pt-16 md:pb-24">
        <HeroShapesLeft />
        <HeroShapesRight />

        <div className="relative z-10 mx-auto max-w-lg text-center">
          <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
            Turn focus into
            <br />a journey.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Explore deep work with the best focus tracker for your day. Turning
            a session into progress has never been so simple.
          </p>

          <div className="mt-6 flex justify-center">
            <GlowButton
              onClick={handleGetStarted}
              loading={isStarting}
              loadingLabel="Starting"
              size="lg"
              className="rounded-full"
            >
              Get Started
            </GlowButton>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            No credit card required.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md md:mx-4 dark:border-neutral-800 dark:bg-neutral-900">
        <HeroPreview />
      </div>
    </div>
  );
}

const HeroPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Move the play button toward the cursor without triggering React re-renders.
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    const button = playButtonRef.current;
    if (!container || !button || isPlaying) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    button.style.transition = "transform 450ms cubic-bezier(0.16, 1, 0.3, 1)";
    button.style.transform = `translate(${x}px, ${y}px)`;
  }

  function handleMouseLeave() {
    const button = playButtonRef.current;
    if (!button) return;
    button.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
    button.style.transform = "translate(0px, 0px)";
  }

  function play() {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    setIsPlaying(true);
  }

  function pause() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
  }

  return (
    <div
      id="hero-preview"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700"
    >
      <video
        ref={videoRef}
        src="/hero.mp4"
        className="aspect-[16/9] h-auto w-full cursor-pointer object-cover"
        onClick={pause}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="FocusJourney app preview"
      />
      <Image
        src="/hero2.png"
        alt="FocusJourney app preview"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          isPlaying ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        height={1000}
        width={1000}
        preload
      />
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isPlaying ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <button
          ref={playButtonRef}
          type="button"
          onClick={play}
          aria-label="Play video"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-white/40 bg-white/20 py-2.5 pr-5 pl-3 text-sm font-medium text-white shadow-lg backdrop-blur-md will-change-transform hover:scale-105"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-900">
            <Play className="ml-0.5 size-4" fill="currentColor" />
          </span>
          Play video
        </button>
      </div>
    </div>
  );
};

const Navbar = ({
  onGetStarted,
  isSignedIn,
}: {
  onGetStarted: () => void;
  isSignedIn: boolean;
}) => {
  return (
    <nav className="flex w-full items-center justify-between px-4 py-6">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full">
          <Image src={"/logo.png"} height={360} width={360} alt="logo" />
        </div>
        <span className="font-heading text-base font-bold text-neutral-900 dark:text-white">
          FocusJourney
        </span>
      </div>
      <div className="flex items-center gap-6">
        <a
          href="https://github.com/kaihere14/focus-journey"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
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
            onClick={onGetStarted}
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

const shapeBase = "absolute drop-shadow-sm";

const HeroShapesLeft = () => {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[38%] md:block">
      <div className="relative h-full w-full">
        {/* blobs */}
        <div
          className={`${shapeBase} top-[2%] left-[4%] h-14 w-14 rounded-[60%_40%_55%_45%/45%_55%_40%_60%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#F5C63D" }}
        />
        <div
          className={`${shapeBase} top-[0%] left-[22%] h-16 w-20 rotate-6 rounded-[50%_50%_45%_55%/60%_40%_60%_40%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#E4C9A0" }}
        />
        <div
          className={`${shapeBase} top-[18%] left-[2%] h-14 w-14 -rotate-12 rounded-[45%_55%_60%_40%/50%_45%_55%_50%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#4FB6E8" }}
        />
        <div
          className={`${shapeBase} top-[26%] left-[26%] h-20 w-20 rounded-[55%_45%_40%_60%/45%_60%_40%_55%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#3CB878" }}
        />
        <div
          className={`${shapeBase} top-[46%] left-[6%] h-16 w-20 rotate-3 rounded-[40%_60%_55%_45%/55%_45%_60%_40%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#FF5B36" }}
        />
        <div
          className={`${shapeBase} top-[54%] left-[30%] h-14 w-14 rounded-[60%_40%_45%_55%/40%_55%_45%_60%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#3CB878" }}
        />
        <div
          className={`${shapeBase} bottom-[4%] left-[10%] h-16 w-24 -rotate-6 rounded-[45%_55%_50%_50%/55%_45%_55%_45%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#FF5B36" }}
        />

        {/* icon accents */}
        <ArrowUpLeft
          className={`${shapeBase} top-[10%] left-[38%] size-8 -rotate-6`}
          fill="#FF5B36"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <Asterisk
          className={`${shapeBase} top-[34%] left-[4%] size-10`}
          fill="#F5C63D"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <Flower2
          className={`${shapeBase} top-[6%] left-[8%] size-9 rotate-12`}
          fill="#3CB878"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <Hexagon
          className={`${shapeBase} top-[38%] left-[16%] size-12`}
          fill="#E4C9A0"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <Cog
          className={`${shapeBase} bottom-[2%] left-[34%] size-9 rotate-12`}
          fill="#F5C63D"
          stroke="#111827"
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};

const HeroShapesRight = () => {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] md:block">
      <div className="relative h-full w-full">
        {/* blobs */}
        <div
          className={`${shapeBase} top-[0%] right-[6%] h-16 w-20 -rotate-6 rounded-[55%_45%_50%_50%/45%_55%_40%_60%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#FF5B36" }}
        />
        <div
          className={`${shapeBase} top-[8%] right-[30%] h-14 w-14 rounded-[45%_55%_60%_40%/55%_45%_50%_50%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#E4C9A0" }}
        />
        <div
          className={`${shapeBase} top-[24%] right-[4%] h-20 w-20 rotate-6 rounded-[60%_40%_45%_55%/40%_60%_45%_55%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#3CB878" }}
        />
        <div
          className={`${shapeBase} top-[46%] right-[28%] h-16 w-20 -rotate-3 rounded-[50%_50%_55%_45%/45%_55%_50%_50%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#F5C63D" }}
        />
        <div
          className={`${shapeBase} top-[56%] right-[6%] h-14 w-14 rounded-[55%_45%_40%_60%/50%_45%_55%_50%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#4FB6E8" }}
        />
        <div
          className={`${shapeBase} bottom-[6%] right-[16%] h-16 w-24 rotate-6 rounded-[45%_55%_55%_45%/55%_45%_45%_55%] border-2 border-neutral-900`}
          style={{ backgroundColor: "#3CB878" }}
        />

        {/* icon accents */}
        <Shield
          className={`${shapeBase} top-[4%] right-[14%] size-10 rotate-6`}
          fill="#4FB6E8"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <CircleCheckBig
          className={`${shapeBase} top-[16%] right-[2%] size-9`}
          fill="#4FB6E8"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <Key
          className={`${shapeBase} top-[36%] right-[34%] size-9 rotate-12`}
          fill="#E4C9A0"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <Heart
          className={`${shapeBase} top-[40%] right-[10%] size-9 -rotate-6`}
          fill="#FF5B36"
          stroke="#111827"
          strokeWidth={1.5}
        />
        <ArrowUpRight
          className={`${shapeBase} bottom-[0%] right-[4%] size-9 rotate-12`}
          fill="#F5C63D"
          stroke="#111827"
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
};
