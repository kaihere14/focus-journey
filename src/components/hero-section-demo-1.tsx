"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
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
} from "lucide-react";

export default function HeroSectionOne() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  function handleGetStarted() {
    if (isLoaded && isSignedIn) {
      router.push("/home");
      return;
    }
    clerk.openSignIn({ forceRedirectUrl: "/home" });
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col">
      <Navbar onGetStarted={handleGetStarted} />

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
            <button
              onClick={handleGetStarted}
              className="font-heading transform rounded-full cursor-pointer bg-black px-7 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Get Started
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            No credit card required.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md md:mx-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
          <Image
            src="/hero2.png"
            alt="FocusJourney app preview"
            className="aspect-[16/9] h-auto w-full object-cover"
            height={1000}
            width={1000}
            preload
          />
        </div>
      </div>
    </div>
  );
}

const Navbar = ({ onGetStarted }: { onGetStarted: () => void }) => {
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
          href="#features"
          className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline dark:text-neutral-400 dark:hover:text-white cursor-pointer"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline dark:text-neutral-400 dark:hover:text-white cursor-pointer"
        >
          Pricing
        </a>
        <button
          onClick={onGetStarted}
          className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
        >
          Sign In
        </button>
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
