import React from "react";
import MapChart from "../MapChart";
import { SingleCountryMapInstructions } from "../singleCountryMapInstructions";
import { DataUpdateBanner } from "../components/DataUpdateBanner";

export const metadata = {
  title: "Country Relations - Global Diplomacy Map | Mapdis",
  description: "Explore diplomatic relationships between countries worldwide with our interactive map. Visualize international relations, alliances, and political dynamics.",
  keywords: "country relations, diplomacy map, international relations, diplomatic ties, global politics",
  alternates: {
    canonical: "https://www.mapdis.com/country",
  },
  openGraph: {
    title: "Country Relations Map - Interactive Global Diplomacy",
    description: "Interactive map showing diplomatic relationships and international alliances between countries worldwide.",
    url: "https://www.mapdis.com/country",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Interactive Country Relations Map",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Country Relations Map - Mapdis",
    description: "Interactive map showing diplomatic relationships between countries worldwide.",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

export default function CountryPage() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <div className = "h-full w-full">
        <MapChart /></div>
      <SingleCountryMapInstructions/>
    </div>
  );
}