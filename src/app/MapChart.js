"use client";

import React, { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";
import "./MapChart.css";
import useCountryStore from "./useCountryStore";
import { Tooltip } from "react-tooltip";
import { useStore } from "./store";
import { SearchBox } from "@/components/ui/SearchBox";
import { Switch } from "@/components/ui/switch";
import { DarkSwitch } from "@/components/ui/darkSwitch";
import { geoRobinson } from "d3-geo-projection";
import { IconRefresh, IconArrowsShuffle } from "@tabler/icons-react";
import ShuffleCountries from "../components/ui/shuffle";
import Tabs from "./tabs";
import { getCountryEmojiCountryEmoji } from "../utils/countryEmojis";

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
  const { rotation, setRotation } = useStore((state) => ({
    rotation: state.rotation,
    setRotation: state.setRotation,
  }));

  const {
    countries,
    incrementCountryPhase,
    isProjectionActive,
    setIsProjectionActive,
    isSecondOrderActive,
    setIsSecondOrderActive,
  } = useCountryStore((state) => ({
    countries: state.countries,
    incrementCountryPhase: state.incrementCountryPhase,
    isProjectionActive: state.isProjectionActive,
    setIsProjectionActive: state.setIsProjectionActive,
    isSecondOrderActive: state.isSecondOrderActive,
    setIsSecondOrderActive: state.setIsSecondOrderActive,
  }));

  // scale, projection and geographies need to be migrated to Zustand store
  const [projectionType, setProj] = useState("geoMercator");
  const [geographiesData, setGeographiesData] = useState([]);

  useEffect(() => {
    fetch("/features.json")
      .then((response) => response.json())
      .then((data) => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);

  return (
    <div
      className="pt-1 grid gap-1 lg:gap-1.5 2xl:gap-2 grid-cols-2 md:grid-cols-7 grid-rows-3  mt-0.5 xl:mt-1 lg:mx-1" /* 2xl:grid-rows-3 2xl:grid-cols-9 */
    >
      
      <div className="border-2 border-primary bg-primary-foreground rounded flex flex-row lg:flex-col p-4 justify-around items-center overflow-hidden md:h-[16.96vw] h-32">
        
        <MapControls />
        <PresetPairings/>
      </div>
      <div className="map-controls border-2 border-primary bg-primary-foreground rounded flex justify-center items-center overflow-hidden md:h-[16.96vw] h-32">
        <SearchBox />
      </div>
      <div
        className="map grid grid-rows-3 md:grid-rows-4 relative row-start-1 row-span-3 col-span-2 md:col-start-2 md:col-[2_/_-2] h-full" /* 2xl:col-start-3 2xl:col-span-5 2xl:row-span-3 */
      >
        <Tabs />
        <div className=" map-container row-span-2 md:row-span-3 overflow-hidden">
          <Map
            rotation={rotation}
            scale="197"
            projectionType={projectionType}
            geographiesData={geographiesData}
            state={countries}
            incrementCountryPhase={incrementCountryPhase}
          />
        </div>
      </div>
      <div className="border-2 border-primary bg-secondary-foreground flex justify-center items-center rounded md:h-[16.96vw] h-32">
        <SearchBox />
      </div>
      <div className="border-2 border-primary bg-secondary-foreground flex justify-center items-center rounded md:h-[16.96vw] h-32 shadow-xl"></div>
      <div className="border-2 border-primary bg-black rounded md:h-[16.96vw] row-start-4 md:row-start-3  flex flex-row md:flex-col items-center justify-around lg:p-5 ">
        <ShuffleCountries />
        <ChangeCountries />
      </div>
      <div className="border-2 border-primary bg-black rounded md:h-[16.96vw] flex items-center justify-center row-start-4 md:row-start-3"></div>
    </div>
  );
}

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
        <select className="rounded shadow bg-primary-foreground text-primary mb-2" onChange={handleSingleCountrySelection}>
          <option value="">Select a country</option>
          <option value="Palestine">Palestine</option>
          <option value="Israel">Israel</option>
          <option value="Kosovo">Kosovo</option>
          <option value="Cyprus">Cyprus</option>
          <option value="Taiwan">Taiwan</option>
          <option value="Armenia">Armenia</option>
          <option value="Nigeria">Nigeria</option>
          <option value="Mexico">Mexico</option>
          <option value="Indonesia">Indonesia</option>
          <option value="Australia">Australia</option>
        </select>
      ) : (
        <select className="rounded shadow bg-primary-foreground text-primary mb-2 w-40" onChange={handlePairingSelection}>
          <option value="">Select a pairing</option>
          <option value="Israel - Iran">Israel - Iran</option>
          <option value="Saudi Arabia - Iran">Saudi Arabia - Iran</option>
          <option value="United States - Iran">United States - Iran</option>
          <option value="United States - Russia">United States - Russia</option>
          <option value="United States - China">United States - China</option>
          <option value="Israel - Palestine">Israel - Palestine</option>
          <option value="Armenia - Azerbaijan">Armenia - Azerbaijan</option>
          <option value="India - Pakistan">India - Pakistan</option>
          <option value="North Korea - South Korea">North Korea - South Korea</option>
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
const ChangeCountries = () => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  return (
    <div className="rounded border-2 border-white shadow shadow-neutral-200 hover:bg-neutral-800 active:shadow-sm">
      <IconRefresh
        onClick={() => {
          resetAllExcept();
        }}
        color="white"
        className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 active:translate-y-[1px]"
      />
    </div>
  );
};



export const MapControls = ({
}) => {
  const { mapMode, setMapMode} = useCountryStore((state) => ({
    mapMode: state.mapMode,
    setMapMode: state.setMapMode,
  }));

  const handleSingleModeToggle = async () => {
    console.log("single mode toggle")
    setMapMode(mapMode == "single" ? "default" : "single");
  };

  const handleProjectionToggle = async () => {
    setMapMode(mapMode != "off" ? "off" : "default");
  };

  const handleWarToggle = async () => {
    setMapMode(mapMode === "war" ? "default" : "war");
  };

  return (
    <div className="view-options-container flex-col overflow-hidden justify-between items-around h-full w-ful text-black font-medium">
      <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2 md:text-sm lg:text-base">
        <DarkSwitch
          checked={(mapMode != "off")}
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
        <DarkSwitch
          checked={(mapMode == "war")}
          onCheckedChange={handleWarToggle}
        />
        <label
          className="toggle-label relative -top-0.5 whitespace-nowrap justify-center ml-1"
          onClick={handleWarToggle}
        >
          {"  "}
           WW3
        </label>
        <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2 md:text-sm lg:text-base">
          <DarkSwitch
            checked={(mapMode == "single")}
            onCheckedChange={handleSingleModeToggle}
          />
          <label className="toggle-label relative -top-0.5 ml-1">
          {"  "}  Single Mode
          </label>
        </div>
      </div>
    </div>
  );
};

const Map = ({
  rotation,
  scale,
  geographiesData,
  state,
  incrementCountryPhase,
}) => {
  const {resetAllExcept} = useCountryStore((state) => ({
    resetAllExcept: state.resetAllExcept
  }));
  const { mapMode} = useCountryStore((state) => ({
    mapMode: state.mapMode
  }));
  const { setCountryPhase } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase
  }));

  const handleCountryClick = (country) => {
    if (mapMode == "single") {
      resetAllExcept()
      setCountryPhase(country, 2);
    } else {
      incrementCountryPhase(country);
    }
  };

  const width = 800;
  const height = 600;

  const projection = geoRobinson()
    .translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotation);
    return (
      <div className="bg-slate-500 rounded-b-lg border-2 lg:border-4 border-t-0 lg:border-t-0 border-primary scale-x-[1.01] sm:scale-x-100">
        <ComposableMap
          viewBox="-60 -15 1000 550"
          projection={projection}
          projectionConfig={{
            rotate: rotation,
            scale: 195,
          }}
        >
          <Sphere stroke="#E4E5E6" strokeWidth={0} />
          <Graticule stroke="#E4E5E6" strokeWidth={0} />
          <Geographies geography={geographiesData}>
            {({ geographies }) => {
              const remainingCountries = geographies.filter(
                (geo) =>
                  state[geo.properties.name].phase !== 2 &&
                  state[geo.properties.name].phase !== 3
              );
              const highlightedCountries = geographies.filter(
                (geo) =>
                  state[geo.properties.name].phase === 2 ||
                  state[geo.properties.name].phase === 3
              );
              // this is so that the countries that are in phase 2 or 3 are drawn on top of the other countries
              // if this isnt done then the borders get wonky, and even if the borders are thickened they are still "under" the other countries
              return (
                <>
                  {remainingCountries.map((geo) => {
                    const countryState = state[geo.properties.name];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo.properties.name)}
                        stroke="black"
                        strokeWidth={0.5}
                        style={{
                          default: {
                            fill: countryState.color,
                            outline: "none",
                          },
                          hover: {
                            fill: countryState.color,
                            outline: "none",
                          },
                          pressed: {
                            fill: countryState.color,
                            outline: "none",
                          },
                        }}
                        className="country cursor-pointer"
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={geo.properties.name}
                      />
                    );
                  })}
                  {highlightedCountries.map((geo) => {
                    const countryState = state[geo.properties.name];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo.properties.name)}
                        stroke="white"
                        strokeWidth={1.3}
                        style={{
                          default: {
                            fill: countryState.color,
                            outline: "none",
                          },
                          hover: {
                            fill: countryState.color,
                            outline: "none",
                          },
                          pressed: {
                            fill: countryState.color,
                            outline: "none",
                          },
                        }}
                        className="country cursor-pointer shadow"
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content= {geo.properties.name}
                      />
                    );
                  })}
                </>
              );
            }}
          </Geographies>
        </ComposableMap>
        <Tooltip id="my-tooltip" float="true" delayShow="800" />
      </div>
    );
};
