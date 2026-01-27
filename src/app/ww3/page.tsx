import React from "react";
import { WW3MapInstructions } from "./mapInstructions";
import WW3MapClient from "./WW3MapClient";
import { DataUpdateBanner } from "../components/DataUpdateBanner";
import { MapVariantNav } from "@/components/custom/MapVariantNav";

export const metadata = {
  title: "WW3 Map - World War 3 Simulation | Mapdis",
  description: "Interactive WW3 map showing potential World War 3 alliance scenarios. Explore how global conflicts could escalate with our war escalation simulator. See how alliances would cascade and nations would choose sides in hypothetical WW3 scenarios.",
  keywords: "ww3 map, world war 3 map, ww3 scenarios, world war 3 simulation, war escalation, ww3 alliance map, world war 3 alliances, global war simulator, ww3 prediction",
  alternates: {
    canonical: "https://www.mapdis.com/ww3",
  },
  openGraph: {
    title: "WW3 Map - World War 3 Simulation | Mapdis",
    description: "Interactive WW3 map showing potential World War 3 alliance scenarios. Explore how global conflicts could escalate with our war escalation simulator.",
    url: "https://www.mapdis.com/ww3",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/warimage.png",
      width: 800,
      height: 600,
      alt: "WW3 Map - World War 3 Alliance Simulation",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WW3 Map - World War 3 Simulation | Mapdis",
    description: "Interactive WW3 map. Explore potential World War 3 alliance scenarios and how conflicts could escalate globally.",
    images: ["https://www.mapdis.com/warimage.png"],
  },
};

export default function WW3Page() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <MapVariantNav />
      <div>
        <WW3MapClient />
      </div>
      <WW3MapInstructions />
    </div>
  );
}
