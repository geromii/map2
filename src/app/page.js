
import React from "react";
import dynamic from "next/dynamic";
import { MapInstructions } from "./mapInstructions";
import { CountryBadge } from "@/components/ui/countryBadge";
import MapChart from "./MapChart";
import { SearchCountry } from "@/components/ui/SearchCountry";
import { MapControls } from "./MapChart";

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-screen w-screen">
      <div>
        <MapChart /></div>
      <MapInstructions />
    </div>
  );
}
