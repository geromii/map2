
import React from "react";
import { MapInstructions } from "./mapInstructions";
import MapChart from "./MapChart";
import { metadata } from "./layout";
import { SingleCountryMapInstructions } from "./singleCountryMapInstructions";



export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">

      <div className = "h-full w-full">
        <MapChart /></div>
      <SingleCountryMapInstructions/>
    </div>
  );
}
