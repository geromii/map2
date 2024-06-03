"use client";
import React, {  useEffect } from "react";

import "./MapChart.css";
import useCountryStore from "./useCountryStore";
import { Switch } from "@/components/ui/switch";
import ShuffleCountries from "../components/custom/shuffle";
import TabDiv from "../components/custom/FrameChildren/TabDiv";
import { MapDiv } from "@/components/custom/FrameChildren/MapDiv";
import MapFrame from "@/components/custom/FrameMapAndSidebar";
import { SearchCountry } from "@/components/custom/SearchCountry";
import useEuCountries from "../utils/eu";


// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/*
Future goals for this project:
4. decide to delete or fix the second order setting
5 . Toggle between: different projections? different color schemes? different data?
6. Option to amplify/bolden when the projections are small
7. Text based summary using GPT

Possible in the backened I need to weigh the importance of each relationship.

1. Add prominent conflicts to the map

*/

export default function MapChart() {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const { setMapMode } = useCountryStore((state) => ({
    setMapMode: state.setMapMode,
  }));

  useEffect(() => {
    resetAllExcept();
    setMapMode("single");
  }, []);
  return (
    <MapFrame
      LeftSidebar={LeftSidebar}
      RightSidebar={RightSidebar}
      TabDiv = {TabDiv}
      MapDiv = {MapDiv}
      pageMode = "single"
    />
  );
}

const RightSidebar = () => {
  return (
    <div className="h-[60%] w-full flex items-start justify-center px-0 pt-2 xl:px-0.5 sm:pt-2 xl:pt-2">
              <div className="h-1/3 p-1 lg:p-[1.5px] xl:p-2 border-muted w-full text-sm lg:text-base">
        <div className=" overflow-hidden">
          <PresetPairings />
        </div>
      </div>
    </div>
  );
};

const LeftSidebar = () => {

  
  return (
    <div className="flex flex-col justify-evenly  text-sm lg:text-base">

                <div className="flex justify-evenly mt-5 lg:text-lg">
            <ShuffleCountries singleMode = {true} />
          </div>


      <div className="w-full pt-5">
        <h2 className=" font-semibold mb-2 pl-3 text-sm text-center lg:text-base">Country Search</h2>
        <SearchCountry pageMode = "single"/>
      </div>
    </div>
  );
};

const PresetPairings = () => {
  const euCountries = useEuCountries();
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);



  const handleSingleCountrySelection = (country) => {
    resetAllExcept(country);
    setCountryPhase(country, 2);
  };

   const handleEuropeanUnionClick = () => {
    resetAllExcept();
    euCountries.forEach((country) => {
      setCountryPhase(country, 2);
    });
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center overflow-y-auto ">
              <h2 className=" font-semibold mb-4 pl-3 text-sm lg:text-base">Quick Access</h2>
        <div className="grid grid-cols-2 mb-2 gap-4 w-full mx-4 px-1">
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Palestine')}>Palestine</button>
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Israel')}>Israel</button>
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Kosovo')}>Kosovo</button>
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Cyprus')}>Cyprus</button>
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Taiwan')}>Taiwan</button>
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Armenia')}>Armenia</button>
          <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400 col-span-2" onClick={() => handleEuropeanUnionClick()}>European Union</button>
        </div>
    </div>
  );
};



export const MapControls = ({}) => {
  const { mapMode, setMapMode } = useCountryStore((state) => ({
    mapMode: state.mapMode,
    setMapMode: state.setMapMode,
  }));

  const handleProjectionToggle = async () => {
    setMapMode(mapMode != "off" ? "off" : "default");
  };

  const handleWarToggle = async () => {
    setMapMode(mapMode === "war" ? "default" : "war");
  };

  return (
    <div className="view-options-container flex-col overflow-hidden justify-between items-around  text-black font-medium">
      <div className="block ml-1 lg:ml-0 mt-1 md:my-2 lg:my-2 ">
        <Switch
          checked={mapMode != "off"}
          onCheckedChange={handleProjectionToggle}
        />
        <label
          className="toggle-label relative -top-0.5 ml-1"
          onClick={handleProjectionToggle}
        >
          {" "}
          Geopolitics
        </label>
      </div>
      <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2">
        <Switch checked={mapMode == "war"} onCheckedChange={handleWarToggle} />
        <label
          className="toggle-label relative -top-0.5 whitespace-nowrap justify-center ml-1"
          onClick={handleWarToggle}
        >
          {"  "}
          WW3
        </label>
      </div>
    </div>
  );
};
