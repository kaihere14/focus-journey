import type { Metadata } from "next";
import HeroSectionOne from "@/components/hero-section-demo-1";
import TravelSection from "@/components/landing/travel-section";
import ConceptBento from "@/components/landing/concept-bento";
import FaqSection from "@/components/landing/faq-section";
import SiteFooter from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Turn focus into a journey",
};

export default function LandingPage() {
  return (
    <>
      <HeroSectionOne />
      <TravelSection />
      <ConceptBento />
      <FaqSection />
      <SiteFooter />
    </>
  );
}
