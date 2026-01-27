
import React from "react";
import { MapInstructions } from "./mapInstructions";
import MapChart from "./MultiCountry";
import { DataUpdateBanner } from "../components/DataUpdateBanner";
import { MapVariantNav } from "@/components/custom/MapVariantNav";

export const metadata = {
  title: "Conflict & Geopolitics Map | Mapdis",
  description: "Interactive geopolitical conflict map. Analyze international disputes, tensions, and rivalries between countries. Compare two nations and see how alliances would align in potential conflicts.",
  keywords: "conflict map, geopolitics map, international disputes, geopolitical tensions, diplomatic crisis map, global conflict analysis, country rivalries, alliance map",
  alternates: {
    canonical: "https://www.mapdis.com/conflict",
  },
  openGraph: {
    title: "Conflict & Geopolitics Map | Mapdis",
    description: "Interactive geopolitical conflict map. Analyze international disputes and tensions. Compare countries and visualize alliance alignments.",
    url: "https://www.mapdis.com/conflict",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Conflict and Geopolitics Map",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conflict & Geopolitics Map | Mapdis",
    description: "Interactive geopolitical conflict map. Analyze international disputes and visualize alliance alignments.",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <MapVariantNav />
      <div>
        <MapChart />
      </div>
      <MapInstructions />
    </div>
  );
}
