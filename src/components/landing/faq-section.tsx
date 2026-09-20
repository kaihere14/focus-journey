"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "What is FocusJourney?",
    a: "A focus app inspired by road travel. Instead of treating a work session as a timer, it represents the session as a journey from a starting point to a destination. You start, progress along a virtual road, pass checkpoints, watch the ETA, and arrive.",
  },
  {
    q: "Is it just another Pomodoro timer?",
    a: "No. A timer still drives the session underneath, but you experience it as distance. Where a typical focus app says 45 minutes remaining, FocusJourney says 32 km until arrival.",
  },
  {
    q: "How does a journey work?",
    a: "Your current location is detected and saved as your starting point. You pick a destination and begin. As the session runs you move along the route, pass checkpoints, and see an ETA. When the session ends, you arrive.",
  },
  {
    q: "What happens when I arrive?",
    a: "The journey is saved to your travel history with its origin, destination, start time, completion time, and duration. Your current location is then updated to that destination.",
  },
  {
    q: "Where does my next journey start?",
    a: "From wherever you last arrived. Finish Delhi → Jaipur and your next session departs from Jaipur, for example Jaipur → Ajmer. Over time your history reads like a travel log.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign in and start your first journey. No credit card required.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-24 rotate-6 items-center justify-center rounded-3xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,1)] dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900 dark:shadow-black/60">
            <Image
              src="/logo.png"
              alt=""
              width={360}
              height={360}
              className="size-12 -rotate-6"
            />
          </div>
          <h2 className="font-heading mt-10 text-3xl leading-[1.05] font-bold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
            Frequently asked questions
          </h2>
        </div>

        <ul className="mt-14 divide-y divide-neutral-200 border-b border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center gap-4 py-5 text-left"
                >
                  <Plus
                    className={`size-4 shrink-0 text-[#4FB6E8] transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    strokeWidth={3}
                  />
                  <span className="text-base font-semibold text-neutral-900 md:text-lg dark:text-white">
                    {item.q}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pl-8 text-sm leading-relaxed text-neutral-600 md:text-[15px] dark:text-neutral-400">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
