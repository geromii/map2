
import React from "react";
import { MapInstructions } from "./mapInstructions";
import MapChart from "./MapChart";

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-full w-screen">
      <div>
        <MapChart /></div>
      <MapInstructions />
    </div>
  );
}
