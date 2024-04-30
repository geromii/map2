"use client"

import React, { useState } from "react";
import useCountryStore from "./useCountryStore";
import TabDemographic from "../components/custom/tabDemographic";
import TabStats from "./tabStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Card, CardHeader } from "@/components/ui/card";




export default function MapTab() {


  return (
      <Tabs defaultValue="data" className="flex flex-col items-center justify-between h-[160px] lg:h-[13.02vw]  w-full md:w-[90%] shadow-[0_5px_15px_-2px_rgba(0,0,0,0.1)] z-20 rounded-lg md:rounded-2xl mb-[-15px] lg:mb-[-30px] md:mt-[20px] bg-card/95 border-2 overflow-hidden ">
        <TabsList className=" mt-2 justify-center w-[95%] md:w-[70%] grid grid-cols-3 shadow-inner mb-0 ">
          <TabsTrigger  value="demographics">Demographics</TabsTrigger>
          <TabsTrigger  value="data">For/Against</TabsTrigger>
          <TabsTrigger value="why">Why?</TabsTrigger>
        </TabsList>
        <TabsContent value="demographics" className="flex justify-center w-full h-full">
          <div className = "w-full">
            < TabDemographic />
          </div>
        </TabsContent>
        <TabsContent value="data" className="flex justify-center w-full h-full">
          <TabStats/>
        </TabsContent>
      </Tabs>
  );
}

function TabContent({ selectedTab }) {
  return (
    <div className="rounded-t-lg row-span-3 bg-secondary text-black border-primary border-2 border-b-1 lg:border-4 lg:border-b-[1px] h-full md:p-5 scale-x-[1.01] sm:scale-x-100 z-10 overflow-hidden">
      {selectedTab === "Data" && <DataContent />}
      {selectedTab === "For/Against" && <StatsContent />}
      {selectedTab === "Overlays" && <OverlaysContent />}
    </div>
  );
}

function NewsContent() {
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  return (
    <div>
      <h1>Preset</h1>
      <ul></ul>
    </div>
  );
}

function StatsContent() {
  return (
    <div>
      <TabStats />
    </div>
  );
}

function OverlaysContent() {
  return <div>Content for Overlays</div>;
}

function DataContent() {
  return (
    <div>
      <TabDemographic />
    </div>
  );
}
