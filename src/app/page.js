
import React from "react";
import MapChart from "./MapChart";
import { SingleCountryMapInstructions } from "./singleCountryMapInstructions";
import { DataUpdateBanner } from "./components/DataUpdateBanner";

export const metadata = {
  title: "Global Relations Map - Geopolitics & Diplomacy | Mapdis",
  description: "Explore the world's geopolitics map and diplomacy map with our interactive tool. Visualize international relations, diplomatic ties, alliances, and global political dynamics. Perfect for understanding geopolitical relationships worldwide.",
  keywords: "geopolitics map, diplomacy map, interactive geopolitics map, global diplomacy map, world geopolitics map, international relations map, diplomatic relations map, political map, alliance map, global politics visualization",
  alternates: {
    canonical: "https://www.mapdis.com",
  },
  openGraph: {
    title: "Geopolitics Map & Diplomacy Map - Interactive Global Relations",
    description: "Interactive geopolitics map and diplomacy map. Explore global diplomatic relationships, international alliances, and political dynamics worldwide.",
    url: "https://www.mapdis.com",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Interactive Geopolitics and Diplomacy Map",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Geopolitics Map & Diplomacy Map - Mapdis",
    description: "Interactive geopolitics map and diplomacy map. Explore global diplomatic relationships and international alliances.",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <div className = "h-full w-full">
        <MapChart /></div>
      <SingleCountryMapInstructions/>
    </div>
  );
}
