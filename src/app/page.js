import React from "react";
import dynamic from "next/dynamic";
import { MapInstructions } from "./mapInstructions";
import { CountryBadge } from "@/components/ui/countryBadge";
import { Suspense } from 'react';
import { MapSkeleton } from "./mapskeleton";
import MapChart from "./MapChart";


export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-screen w-screen">
      <div className="block">
      <Suspense fallback={<MapSkeleton />}>
        <MapChart />
      </Suspense>
      <div className="instructions lg:hidden">
          <MapInstructions />
      </div>
      </div>
      <div className="instructions hidden lg:block">
        <MapInstructions />
      </div>
    <CountryBadge country="USA" color="red" />
    </div>
  );
}
