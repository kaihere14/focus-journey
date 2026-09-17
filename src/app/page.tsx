import type { Metadata } from "next";
import HeroSectionOne from "@/components/hero-section-demo-1";

export const metadata: Metadata = {
  title: "Turn focus into a journey",
};

export default function LandingPage() {
  return <HeroSectionOne />;
}
