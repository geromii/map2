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
import { SearchCountry } from "@/components/ui/SearchCountry";
import { SearchBox } from "@/components/ui/SearchBox";
import { Switch } from "@/components/ui/switch";
import { geoRobinson } from "d3-geo-projection";
import { IconRefresh } from "@tabler/icons-react";
import Tabs from "./tabs";

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
    <div className="pt-1 grid gap-1 lg:gap-1.5 2xl:gap-2 grid-cols-2 md:grid-cols-7 grid-rows-3  mt-0.5 xl:mt-1 lg:mx-1" /* 2xl:grid-rows-3 2xl:grid-cols-9 */>
      <div className="country-search border-2 border-primary bg-primary-foreground rounded-lg flex justify-center items-center overflow-hidden md:h-[16.96vw] h-32">
      </div>
      <div className="map-controls border-2 border-primary bg-accent rounded-lg flex justify-center items-center overflow-hidden md:h-[16.96vw] h-32">
        <MapControls
          isProjectionActive={isProjectionActive}
          setIsProjectionActive={setIsProjectionActive}
          isSecondOrderActive={isSecondOrderActive}
          setIsSecondOrderActive={setIsSecondOrderActive}
        />
      </div>
      <div className="map grid grid-rows-3 md:grid-rows-4 relative row-start-1 row-span-3 col-span-2 md:col-start-2 md:col-[2_/_-2] h-full" /* 2xl:col-start-3 2xl:col-span-5 2xl:row-span-3 */ >
        <Tabs/>
        <div className=" map-container row-span-2 md:row-span-3 overflow-hidden">
          <Map
            rotation={rotation}
            scale="197"
            projectionType={projectionType}
            geographiesData={geographiesData}
            state={countries}
            handleCountryClick={incrementCountryPhase}
          />
        </div>
      </div>
      <div className="border-2 border-primary bg-[#087E8B] flex justify-center items-center rounded-xl md:h-[16.96vw] h-32"> Search </div>
      <div className="border-2 border-primary bg-primary-foreground flex justify-center items-center rounded-xl md:h-[16.96vw] h-32"><SearchBox /></div>
      <div className="border-2 border-primary bg-black rounded-xl md:h-[16.96vw] hidden lg:block "></div>
      <div className="border-2 border-primary bg-black rounded-xl md:h-[16.96vw] hidden lg:block"></div>
    </div>
  );
}

// refresh button to reset all countries
const ChangeCountries = ({ handleCountryClick, state, useCountries }) => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  return (
    <div className="flex flex-col flew-row items-center">
      <button
        onClick={() => {
          resetAllExcept();
        }}
        className=" text-white font-bold py-2 px-2 rounded-sm lg:rounded-full"
      >
        <IconRefresh color="#e6e3e3" />
      </button>
    </div>
  );
};

export const MapControls = ({
  isProjectionActive,
  setIsProjectionActive,
  isSecondOrderActive,
  setIsSecondOrderActive,
}) => {


  const handleProjectionToggle = async () => {
    setIsProjectionActive(!isProjectionActive);
  };

  const handleSecondOrderToggle = async () => {
    setIsSecondOrderActive(!isSecondOrderActive);
  };

  return (
    <div className= "view-options-container block overflow-hidden justify-center items-center lg:justify-start lg:items-start h-auto">
      <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2 md:text-sm lg:text-base">
        <Switch
          checked={isProjectionActive}
          onCheckedChange={handleProjectionToggle}
        />
        <label
          className="toggle-label relative -top-0.5"
          onClick={handleProjectionToggle}
        >
          {" "}
          Geopolitics
        </label>
      </div>
      <div className="block ml-1 lg:ml-0 mt-1 md:mt-2 lg:mt-2 md:text-sm lg:text-base">
        <Switch
          checked={isSecondOrderActive}
          onCheckedChange={handleSecondOrderToggle}
        />
        <label
          className="toggle-label relative -top-0.5 whitespace-nowrap"
          onClick={handleSecondOrderToggle}
        >
          {" "}
          War Outbreak
        </label>
        <div className="lg:hidden"></div>
      </div>
    </div>
  );
};

const Map = ({
  rotation,
  scale,
  geographiesData,
  state,
  handleCountryClick,
}) => {
  const width = 800;
  const height = 600;

  const projection = geoRobinson()
    .translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotation);
  return (
    <div className="bg-slate-500 rounded-b-xl border-2 lg:border-4 border-t-0 lg:border-t-0 border-primary scale-x-[1.01] sm:scale-x-100">
      <ComposableMap
        viewBox="-60 -15 1000 550" // 0 0 800 450 default, [x, y, width, height]
        projection={projection}
        projectionConfig={{
          rotate: rotation,
          scale: 195, // 180
        }}
      >
        <Sphere stroke="#E4E5E6" strokeWidth={0} />
        <Graticule stroke="#E4E5E6" strokeWidth={0} />
        <Geographies geography={geographiesData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryState = state[geo.properties.name]; // Access the state for each country
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => handleCountryClick(geo.properties.name)}
                  stroke="black"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      fill: countryState.color, // Use the state to get the color
                      outline: "none",
                    },
                    hover: {
                      fill: countryState.color, // hover color
                      outline: "none",
                    },
                    pressed: {
                      fill: countryState.color, // pressed color
                      outline: "none",
                    },
                  }}
                  className="country"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={geo.properties.name}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <Tooltip id="my-tooltip" float="true" delayShow="800" />
    </div>
  );
};
