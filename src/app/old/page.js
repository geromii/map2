
import React from "react";
import { MapInstructions } from "../mapInstructions";
import MapChart from "./ww3";


export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-screen w-screen">
      <div>
        <MapChart /></div>
      <MapInstructions />
    </div>
  );
}