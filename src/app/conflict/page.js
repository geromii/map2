
import React from "react";
import { MapInstructions } from "./mapInstructions";
import MapChart from "./MultiCountry";
import { DataUpdateBanner } from "../components/DataUpdateBanner";

export const metadata = {
  title: "Geopolitical Conflict & WW3 Map | Mapdis",
  description: "Interactive diplomatic conflict map with WW3 map mode. Analyze international disputes and tensions, or activate War Escalation Mode to explore potential World War 3 scenarios. Visualize how diplomatic conflicts could escalate into global war on our interactive map.",
  keywords: "diplomatic conflicts, ww3 map, world war 3 map, conflict map, international disputes, war escalation, ww3 scenarios, world war 3 simulation, geopolitical tensions, diplomatic crisis map, global conflict analysis",
  alternates: {
    canonical: "https://www.mapdis.com/conflict",
  },
  openGraph: {
    title: "Diplomatic Conflicts & WW3 Map - World War 3 Scenarios",
    description: "Explore diplomatic conflicts and potential WW3 scenarios. Interactive map showing international disputes with War Escalation Mode for World War 3 simulations.",
    url: "https://www.mapdis.com/conflict",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Diplomatic Conflicts and WW3 Map Scenarios",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diplomatic Conflicts & WW3 Map - Mapdis",
    description: "Interactive conflict map with WW3 scenarios. Explore diplomatic tensions and potential World War 3 outcomes.",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <DataUpdateBanner />
      <div>
        <MapChart /></div>
      <MapInstructions />
    </div>
  );
}
