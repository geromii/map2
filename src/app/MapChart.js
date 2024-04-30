"use client";

import React, { useState, useEffect } from "react";

import "./MapChart.css";
import useCountryStore from "./useCountryStore";
import { SearchBox } from "@/components/custom/SearchBox";
import { DarkSwitch } from "@/components/ui/darkSwitch";
import { Switch } from "@/components/ui/switch";
import {
  IconRefresh,
  IconArrowsShuffle,
  IconArrowsDiagonal,
  IconArrowsDiagonal2,
  IconArrowsDiagonalMinimize,
  IconArrowsDiagonalMinimize2,
  IconArrowsMaximize,
  IconArrowsMinimize
} from "@tabler/icons-react";
import ShuffleCountries from "../components/custom/shuffle";
import Tabs from "./mapTabs_copy";
import { getCountryEmoji } from "../utils/countryEmojis";
import { MapBox } from "@/components/custom/MapBox";
import IconButton from "../components/custom/boxbutton";
import MapFrame from "@/components/custom/FrameMapAndSidebar";

// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/*
Future goals for this project:
1. Demographic information of each side
2. better scale the data? perhaps square all values?
3. change the color scheme multiplier from 0.5 to 1
4. decide to delete or fix the second order setting
5 . Toggle between: different projections? different color schemes? different data?
6. Option to amplify/bolden when the projections are small
7. Text based summary using GPT


Possible in the backened I need to weigh the importance of each relationship.

1. Add prominent conflicts to the map
2. Demographic information of each side

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
      MainMap={MapBox}
    />
  );
}

const RightSidebar = () => {
  return (
    <div className="h-[60%] w-full flex items-start justify-center px-0 xl:px-0.5 sm:pt-2 xl:pt-4">
      <div className="w-full">
        <h2 className=" font-semibold mb-2 pl-3">Country Search</h2>
        <SearchBox />
      </div>
    </div>
  );
};

const LeftSidebar = () => {
  return (
    <div className="flex flex-col justify-evenly  text-sm">
                <div className="flex justify-evenly mt-4">
            <ShuffleCountries singleMode = {true} />
            <ResetCountries />
          </div>
      <div className="h-1/3 p-1 lg:p-2 xl:p-4 border-muted">
        <h2 className=" font-semibold">Map Controls</h2>
        <div className="mt-2 pl-1 xl:pl-2">
          <MapControls />
        </div>
      </div>

      <div className="h-1/3 p-1 lg:p-[1.5px] xl:p-4 border-muted w-full text-sm">
        <h2 className=" font-semibold">Presets</h2>
        <div className="mt-2 overflow-hidden">
          <PresetPairings />
        </div>
      </div>
    </div>
  );
};

const PresetPairings = () => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  const mapMode = useCountryStore((state) => state.mapMode);

  const handlePairingSelection = (event) => {
    const [country1, country2] = event.target.value.split("-");
    resetAllExcept();
    setCountryPhase(country1.trim(), 2);
    if (country2) {
      setTimeout(() => {
        setCountryPhase(country2.trim(), 3);
      }, 1);
    }
  };

  const handleSingleCountrySelection = (event) => {
    const country = event.target.value;
    resetAllExcept();
    setCountryPhase(country, 2);
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center overflow-y-auto">
      {mapMode === "single" ? (
        <select
          className="rounded-md shadow bg-primary text-white p-1  mb-2"
          onChange={handleSingleCountrySelection}
        >
          <option value="">Select country</option>
          <option value="Palestine">Palestine</option>
          <option value="Israel">Israel</option>
          <option value="Kosovo">Kosovo</option>
          <option value="Cyprus">Cyprus</option>
          <option value="Taiwan">Taiwan</option>
          <option value="Armenia">Armenia</option>
        </select>
      ) : (
        <select
          className="rounded shadow bg-primary-foreground text-wh mb-2 w-40"
          onChange={handlePairingSelection}
        >
          <option value="">Select a pairing</option>
          <option value="Israel - Iran">Israel - Iran</option>
          <option value="Saudi Arabia - Iran">Saudi Arabia - Iran</option>
          <option value="United States - Iran">United States - Iran</option>
          <option value="United States - Russia">United States - Russia</option>
          <option value="United States - China">United States - China</option>
          <option value="Israel - Palestine">Israel - Palestine</option>
          <option value="Armenia - Azerbaijan">Armenia - Azerbaijan</option>
          <option value="India - Pakistan">India - Pakistan</option>
          <option value="North Korea - South Korea">
            North Korea - South Korea
          </option>
          <option value="Russia - Ukraine">Russia - Ukraine</option>
          <option value="Turkey - Greece">Turkey - Greece</option>
          <option value="China - Taiwan">China - Taiwan</option>
          <option value="China - India">China - India</option>
          <option value="Iran - Saudi Arabia">Iran - Saudi Arabia</option>
          <option value="Syria - Turkey">Syria - Turkey</option>
          <option value="Saudi Arabia - Yemen">Saudi Arabia - Yemen</option>
          <option value="Ethiopia - Egypt">Ethiopia - Egypt</option>
        </select>
      )}
    </div>
  );
};

// refresh button to reset all countries
const ResetCountries = () => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  return (
    <IconButton
      icon={IconRefresh}
      size = "medium"
      onClick={() => {
        resetAllExcept();
      }}
    />
  );
};

export const MapControls = ({}) => {
  const { mapMode, setMapMode } = useCountryStore((state) => ({
    mapMode: state.mapMode,
    setMapMode: state.setMapMode,
  }));

  const handleSingleModeToggle = async () => {
    console.log("single mode toggle");
    setMapMode(mapMode == "single" ? "default" : "single");
  };

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
