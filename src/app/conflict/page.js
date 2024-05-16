
import React from "react";
import dynamic from "next/dynamic";
import { MapInstructions } from "./mapInstructions";
import MapChart from "./MultiCountry";

export const metadata = {
  title: "Conflict Mapper - Mapdis",
  description: "An interactive map that displays the potential geopolitical wars and conflicts of the world. Click any two countries to see a theoretical conflict map, or turn on War Escalation Mode to see hypotethitcal WW3 scenarios.",
};

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <div>
        <MapChart /></div>
      <MapInstructions />
    </div>
  );
}
