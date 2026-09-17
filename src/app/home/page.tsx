"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { FocusMap } from "@/components/map/focus-map";

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <main style={{ position: "fixed", inset: 0 }} className="bg-black p-2">
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        <FocusMap />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <div className="pointer-events-none flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <Image
              src="/logo.png"
              alt=""
              width={18}
              height={18}
              className="rounded-sm"
            />
            <span className="text-sm font-medium tracking-wide text-white">
              FocusJourney
            </span>
          </div>

          <div className="pointer-events-auto rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
            <UserButton
              appearance={{
                elements: { avatarBox: "size-7" },
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
