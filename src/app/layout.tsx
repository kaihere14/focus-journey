import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const matter = Inter({
  variable: "--font-matter",
  subsets: ["latin"],
});

const seasonMix = Bricolage_Grotesque({
  variable: "--font-season-mix",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FocusJourney",
    template: "%s · FocusJourney",
  },
  description:
    "FocusJourney turns a focus session into a journey from your location to a destination, with checkpoints, an ETA, and an arrival.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${matter.variable} ${seasonMix.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
