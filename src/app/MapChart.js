"use client";

import React, { useState } from "react";

import "./MapChart.css";
import useCountryStore from "./useCountryStore";
import { SearchBox } from "@/components/custom/SearchBox";
import { DarkSwitch } from "@/components/ui/darkSwitch";
import { Switch } from "@/components/ui/switch";
import { IconRefresh, IconArrowsShuffle } from "@tabler/icons-react";
import ShuffleCountries from "../components/custom/shuffle";
import Tabs from "./mapTabs copy";
import { getCountryEmoji } from "../utils/countryEmojis";
import { MapBox } from "@/components/custom/MapBox";
import IconButton from "../components/custom/boxbutton";

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

  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true)
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true)
  

  const sidebarFull = 270
  const sidebarSmall = 80
  
  const leftSidebarWidth = leftSidebarVisible ? sidebarFull : sidebarSmall
  const rightSidebarWidth = rightSidebarVisible ? sidebarFull : sidebarSmall
  const mapWidth = 100 - leftSidebarWidth - rightSidebarWidth
  const marginRight = rightSidebarVisible ? -20 : 0
  const marginLeft = leftSidebarVisible ? -20 : 0


  const sidebarClasses = ` self-center  rounded-xl shadow-2xl border z-20 h-[60%] bg-card w-full`
  return (
    <div className="pt-1 w-screen flex justify-between  mt-0.5 xl:mt-1 lg:my-1 pb-[200px] ">
      <div style={{width: `${leftSidebarWidth}px`}} className="self-stretch transition-all duration-300 ease-in-out flex">
      <div className={sidebarClasses + ` rounded-l-none border-l-0 `} >
      <button onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}>Toggle Left Sidebar</button>
        <LeftSidebar />
      </div>
      </div>
      <div style={{marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`}} className= "map w-[80%]  row-start-1 transition-all duration-300 ease-in-out h-full ">
        <MapBox />

      </div>
      <div style={{width: `${rightSidebarWidth}px`}} className="self-stretch transition-all duration-300 ease-in-out flex">
      <div  className={sidebarClasses + ` rounded-r-none  border-r-0`}>
      <button onClick={() => setRightSidebarVisible(!rightSidebarVisible)}>Toggle Right Sidebar</button>
        <RightSidebar/>
      </div>
      </div>
    </div>
  );
}

const LeftSidebar = () => {
  return (
    <div className="h-[60%] w-full flex items-start justify-center px-1 sm:pt-2 xl:pt-4">
      <div className="w-full">
       <SearchBox/>
      </div>
    </div>
  );
};

const RightSidebar = () => {
  return (
    <div className="flex flex-col justify-evenly  overflow-hidden mb-10  " >
      <div className="h-1/3 p-4 border-muted">
        <h2 className=" font-semibold">Map Controls</h2>
        <div className="mt-2">
          <MapControls />
          <div className="flex justify-around mt-2">
            <ShuffleCountries /><ResetCountries />
          </div>
        </div>
      </div>

      <div className="h-1/3 p-4 border-muted">
        <h2 className=" font-semibold">Presets</h2>
        <div className="mt-2"><PresetPairings /></div>
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
      <h2>Presets</h2>
      {mapMode === "single" ? (
        <select
          className="rounded-none shadow bg-black text-white mb-2"
          onChange={handleSingleCountrySelection}
        >
          <option value="">Select a country</option>
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
      <div className="block ml-1 lg:ml-0 mt-1 md:my-2 lg:my-2 md:text-sm lg:text-base">
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
      <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2 md:text-sm lg:text-base">
        <Switch checked={mapMode == "war"} onCheckedChange={handleWarToggle} />
        <label
          className="toggle-label relative -top-0.5 whitespace-nowrap justify-center ml-1"
          onClick={handleWarToggle}
        >
          {"  "}
          WW3
        </label>
        <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2 md:text-sm lg:text-base">
          <Switch
            checked={mapMode == "single"}
            onCheckedChange={handleSingleModeToggle}
          />
          <label className="toggle-label relative -top-0.5 ml-1">
            {"  "} Single Mode
          </label>
        </div>
      </div>
    </div>
  );
};
