"use client";

import React from "react";
import { MapDiv } from "@/components/custom/MapDiv";
import { Tooltip } from "react-tooltip";
import MapTab from "@/app/mapTabs copy";

import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
  } from "@/components/ui/card";

export function MapBox(geographiesData) {
  return (
    <div className =  " flex flex-col items-center  bg-transparent md:scale-[1.00]">
      <MapTab />
      <div className=" map-container w-full h-full ">
        <MapDiv geographiesData={geographiesData} />
        <Tooltip id="my-tooltip" float="true" delayShow="800" />
      </div>
    </div>
  );
}
