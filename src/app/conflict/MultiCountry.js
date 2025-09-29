"use client";

import React, {  useEffect} from "react";

import "./multiapp.css";
import useCountryStore from "../useCountryStore";
import { SearchBox } from "@/components/custom/SearchBox";
import { Switch } from "@/components/ui/switch";
import {
  IconTrash,
} from "@tabler/icons-react";
import ShuffleCountries from "../../components/custom/shuffle";
import TabDiv from "../../components/custom/FrameChildren/TabDiv";
import { MapDiv } from "@/components/custom/FrameChildren/MapDiv";
import IconButton from "../../components/custom/boxbutton";
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
    setMapMode("default");
  }, [resetAllExcept, setMapMode]);
  return (
    <MapFrame
    LeftSidebar={LeftSidebar}
    RightSidebar={RightSidebar}
    TabDiv = {TabDiv}
    MapDiv = {MapDiv}
    pageMode = "multi"
  />
  );
}

const RightSidebar = () => {
  return (
    <div className="h-full w-full flex items-start justify-center px-1 pt-4 sm:pt-2 xl:pt-4 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <h2 className=" font-semibold mb-2 pl-3 flex-shrink-0">Country Search</h2>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SearchBox />
        </div>
      </div>
    </div>
  );
};

const LeftSidebar = () => {
  return (
    <div className="flex flex-col justify-evenly  mb-3  ">
      <div className="h-1/3 p-2 border-muted">
        <div className="mt-2 pl-2 lg:pl-3">
          <MapControls />
        </div>
          <div className="flex justify-evenly mb-4 mt-4">
            <ShuffleCountries />
            <ResetCountries />
          </div>
      </div>

      <div className="h-1/3 p-1 border-muted w-full">
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


  return (
    <div className="w-full h-full flex flex-col justify-start items-center overflow-y-auto">

        <select
          className="rounded shadow bg-primary-foreground text-wh mb-1 mt-0.5 w-40"
          aria-label="Select a country pairing preset"
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
    </div>
  );
};

// clear button to reset all countries
const ResetCountries = () => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  return (
    <IconButton
      icon={IconTrash}
      size = "medium"
      aria-label="Clear map - reset all countries"
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


  const handleProjectionToggle = async () => {
    setMapMode(mapMode != "off" ? "off" : "default");
  };

  const handleWarToggle = async () => {
    setMapMode(mapMode === "war" ? "default" : "war");
  };

  return (
    <div className="view-options-container flex-col overflow-hidden justify-between items-around text-black font-medium">
      <div className="block ml-0.5 lg:ml-0 mt-1 md:mt-2 lg:mt-2">
        <Switch checked={mapMode == "war"} onCheckedChange={handleWarToggle} aria-label="Toggle war mode" />
        <label
          className="toggle-label relative -top-0.5 whitespace-nowrap justify-center ml-0.5 font-bold"
          onClick={handleWarToggle}
        >
          {"  "}
          War Mode
        </label>
      </div>
      <div className="block ml-0.5 lg:ml-0 mt-1 md:my-2 lg:my-2 ">
        <Switch
          checked={mapMode != "off"}
          onCheckedChange={handleProjectionToggle}
          aria-label="Toggle predictions display"
        />
        <label
          className="toggle-label relative -top-0.5 ml-0.5"
          onClick={handleProjectionToggle}
        >
          {" "}
          Predictions
        </label>
      </div>
    </div>
  );
};
