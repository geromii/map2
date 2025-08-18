
import React from "react";
import MapChart from "./MapChart";
import { SingleCountryMapInstructions } from "./singleCountryMapInstructions";
import { DataUpdateBanner } from "./components/DataUpdateBanner";




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
