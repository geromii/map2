"use client"

import React, { useState } from "react";
import useCountryStore from "./useCountryStore";
import TabDemographic from "../components/custom/tabDemographic";
import TabStats from "./tabStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader } from "@/components/ui/card";



export default function MapTab() {


  return (
      <Tabs defaultValue="demographics" className="flex flex-col items-center justify-between h-[13.02vw] w-full  md:w-[90%] shadow z-20 border rounded-2xl md:translate-y-8 bg-card/60 backdrop-blur-lg">
        <TabsList className=" mt-2 justify-center w-full md:w-[70%] grid grid-cols-3 shadow-sm">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="data">For/Against</TabsTrigger>
          <TabsTrigger value="why">Why?</TabsTrigger>
        </TabsList>
        <TabsContent value="demographics" className="flex justify-center w-full">
          <div className = "w-full">
            < TabDemographic />
          </div>
        </TabsContent>
        <TabsContent value="password" className="flex justify-center">
          Change your password here.
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
