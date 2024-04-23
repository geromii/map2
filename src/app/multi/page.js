
import React from "react";
import dynamic from "next/dynamic";
import { MapInstructions } from "../mapInstructions";
import MapChart from "./MultiCountry";

export default function Home() {
  return (
    <div className="transition ease-in-out whole-container h-screen w-screen">
      <div>
        <MapChart /></div>
      <MapInstructions />
    </div>
  );
}
