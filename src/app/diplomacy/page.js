
import React from "react";
import MapChart from "../MapChart";
import { SingleCountryMapInstructions } from "../singleCountryMapInstructions";
import { DataUpdateBanner } from "../components/DataUpdateBanner";
import { MapVariantNav } from "@/components/custom/MapVariantNav";

export const metadata = {
  title: "Diplomacy & Global Relations Map | Mapdis",
  description: "Explore the world's diplomacy and global relations with our interactive map. Visualize international relations, diplomatic ties, alliances, and political dynamics for any country. Perfect for understanding geopolitical relationships worldwide.",
  keywords: "diplomacy map, global relations map, geopolitics map, interactive diplomacy map, international relations map, diplomatic relations map, political map, alliance map, global politics visualization",
  alternates: {
    canonical: "https://www.mapdis.com/diplomacy",
  },
  openGraph: {
    title: "Diplomacy & Global Relations Map | Mapdis",
    description: "Interactive diplomacy and global relations map. Explore diplomatic relationships, international alliances, and political dynamics for any country worldwide.",
    url: "https://www.mapdis.com/diplomacy",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Interactive Diplomacy and Global Relations Map",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diplomacy & Global Relations Map | Mapdis",
    description: "Interactive diplomacy and global relations map. Explore diplomatic relationships and international alliances for any country.",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <MapVariantNav />
      <div className="h-full w-full">
        <MapChart />
      </div>
      <SingleCountryMapInstructions />
    </div>
  );
}
