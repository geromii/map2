"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useReducer,
  memo,
} from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { useCountries } from "./useCountries";
import "./MapChart.css";
import useCountryStore from "./useCountryStore";
import { multiplyWithScoresMatrix } from "./matrixOperations";
import { Tooltip } from "react-tooltip";
import { useStore } from "./store";
import { SearchCountry } from "@/components/ui/SearchCountry";
import { Switch } from "@/components/ui/switch";
import { geoRobinson } from "d3-geo-projection";

// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/*
Future goals for this project:
1. Demographic information of each side
2. fix the data. perhaps square all values?
3. change the color scheme multiplier from 0.5 to 1
4. decide to delete or fix the second order setting
5 . Toggle between: different projections? different color schemes? different data?
6. Option to amplify/bolden when the projections are small
7. Text based summary


Possible in the backened I need to weigh the importance of each relationship.


*/

export default function MapChart() {
  const { 
    rotation,
    setRotation
  } = useStore((state) => ({
    rotation: state.rotation,
    setRotation: state.setRotation
  }));
  const { 
    isProjectionActive,
    setIsProjectionActive,
    isSecondOrderActive,
    setIsSecondOrderActive
  } = useCountryStore((state) => ({
    isProjectionActive: state.isProjectionActive,
    setIsProjectionActive: state.setIsProjectionActive,
    isSecondOrderActive: state.isSecondOrderActive,
    setIsSecondOrderActive: state.setIsSecondOrderActive
  }));
  const [scale, setScale] = useState(180);
  const [projectionType, setProj] = useState("geoMercator");
  const [geographiesData, setGeographiesData] = useState([]);
  const countries = useCountryStore((state) => state.countries);
  const incrementCountryPhase = useCountryStore(
    (state) => state.incrementCountryPhase,
  );

  // First useEffect: Retain this for fetching geographies data
  useEffect(() => {
    fetch("/features.json")
      .then((response) => response.json())
      .then((data) => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);

  let dispatchTimeoutId; // Variable to store the timeout ID

  const handleCountryClick = (countryName) => {
    incrementCountryPhase(countryName);
  };

  return (
    <div className="transition ease-in-out whole-container h-screen w-screen">
      <div className="block">
        <div className="map-container z-11 lg:relative top-0 right-0 bottom-0 left-0 lg:z-0 overflow-auto lg:border-b-4">
          <Map
            rotation={rotation}
            scale={scale}
            projectionType={projectionType}
            geographiesData={geographiesData}
            state={countries}
            handleCountryClick={handleCountryClick}
          />
        </div>
        <div className="map-controls pt-2 pb-2 border-x-4 border-y-2 lg:border-y-4 lg:absolute lg:top-0 lg:left-0 z-10 bg-slate-100 lg:h-28 lg:w-52 lg:rounded-br-3xl lg:pt-0 lg:overflow-hidden lg:pl-6">
          <MapControls
            setRotation={setRotation}
            setScale={setScale}
            setProj={setProj}
            isProjectionActive={isProjectionActive}
            setIsProjectionActive={setIsProjectionActive}
            isSecondOrderActive={isSecondOrderActive}
            setIsSecondOrderActive={setIsSecondOrderActive}
            useCountryStore={useCountryStore}
          />
        </div>
        <div className="country-search border-x-4 border-y-2 lg:border-y-4 pl-2 pr-2 pt-2 pb-2 lg:absolute lg:top-0 lg:right-0 z-10 bg-slate-100 lg:overflow-x-hidden lg:overflow-y-auto lg:rounded-bl-3xl lg:pl-1 lg:h-28 lg:w-52">
          <SearchCountry
            handleCountryClick={handleCountryClick}
            state={countries}
            useCountries={useCountries}
          />
        </div>
        <div className="instructions lg:hidden">
          <Instructions />
        </div>
      </div>
      <div className="instructions hidden lg:block">
        <Instructions />
      </div>
    </div>
  );
}





const Instructions = () => {
  return (
    <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
      <section>
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
            How to use
          </h1>
        </header>
        <p className="mb-8 text-gray-600">
          Click countries on the map until you have at least one country on the{" "}
          <span className="text-red-800">Red side</span> (click once), and at
          least one country on the{" "}
          <span className="text-blue-800">Blue side</span> (click twice). You
          will then see a global opinion map.
        </p>
      </section>
      <section className="mb-8 lg:mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 lg:text-3xl">
          Countries have 4 states:
        </h2>
        <ol className="mt-2 list-decimal list-inside bg-white p-6 rounded-lg shadow space-y-3 lg:p-8">
          <li className="color-transition font-medium lg:text-lg">
            Undecided (Variable)
          </li>
          <li className="text-red-800 font-medium lg:text-lg">
            Side A (Dark Red)
          </li>
          <li className="text-blue-800 font-medium lg:text-lg">
            Side B (Dark Blue)
          </li>
          <li className="text-gray-700 font-medium lg:text-lg">
            Neutral (Dark Gray)
          </li>
        </ol>
        <p className="mt-6 text-gray-700 lg:text-lg">
          Clicking a country (or selecting it through the search) will cycle its
          state.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          <span className="font-bold">Geopolitics Mode</span>:
        </h2>
        <p className="text-gray-600 mt-2">
          When <span className="font-bold">Geopolitics Mode</span> is on and
          there is at least one country in each of{" "}
          <span className="text-red-800">Side A</span> and{" "}
          <span className="text-blue-800">Side B</span>, every country in the
          undecided state receives a probability of siding with either{" "}
          <span className="text-red-800">Side A</span> or{" "}
          <span className="text-blue-800">Side B</span> depending on its
          relationships with the respective sides. Each country&apos;s
          probability of siding with <span className="text-red-800">A</span> or{" "}
          <span className="text-blue-800">B</span> will be reflected by their
          color on the map.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-gray-700">
          <span className="font-bold">War Outbreak Mode</span>:
        </h2>
        <p className="text-gray-600 mt-2">
          When <span className="font-bold">War Outbreak Mode</span> is on the
          calculation gets more complex. Instead, the countries in the undecided
          state now receive a predicted side according to what their allies
          think about the conflict (the second order relationship). For example,{" "}
          <span className="color-transition font-medium">Germany</span> may not
          initially take a side if{" "}
          <span className="text-red-800">Saudi Arabia</span> and{" "}
          <span className="text-blue-800">Iran</span> go to war, but when all of
          its major allies side with{" "}
          <span className="text-red-800">Saudi Arabia</span>, they are much more
          inclined to do the same. However, if an ally is in the{" "}
          <span className="text-gray-800 font-medium">Neutral</span> state then
          that country will be excluded from the calculation.
        </p>
      </section>
    </article>
  );
};

const MapControls = ({
  setRotation,
  setScale,
  setProj,
  isProjectionActive,
  setIsProjectionActive,
  isSecondOrderActive,
  setIsSecondOrderActive,
  useCountryStore,
}) => {
  const [isPacific, setIsPacific] = useState(false);
  const { countries, incrementCountryPhase } =
    useCountryStore((state) => state);

  const handleToggle = () => {
    setIsPacific(!isPacific);
    if (!isPacific) {
      setRotation([-150, 0, 0]);
      setScale(160);
      setProj("geoEqualEarth");
    } else {
      setRotation([-10, 0, 0]);
      setScale(180);
      setProj("geoEqualEarth");
    }
  };

  const handleProjectionToggle = async () => {
    setIsProjectionActive(!isProjectionActive);
  };

  const handleSecondOrderToggle = async () => {
    setIsSecondOrderActive(!isSecondOrderActive);
  };


  return (
    <div className="view-options-container flex lg:block justify-center items-center h-full lg:justify-start lg:items-start lg:h-auto">
      <div className="inline lg:block ml-1 lg:ml-0 mt-2 lg:mt-2">
        <Switch
          checked={isPacific}
          onCheckedChange={handleToggle}
          // Add additional Shadcn Switch props as needed
        />
        <label
          className="toggle-label relative -top-0.5"
          onClick={handleToggle}
        >
          {" "}
          Pacific
        </label>
      </div>
      <div className="inline lg:block ml-1 lg:ml-0 mt-2 lg:mt-2">
        <Switch
          checked={isProjectionActive}
          onCheckedChange={handleProjectionToggle}
          // Add additional Shadcn Switch props as needed
        />
        <label
          className="toggle-label relative -top-0.5"
          onClick={handleProjectionToggle}
        >
          {" "}
          Geopolitics
        </label>
      </div>
      <div className="inline lg:block ml-1 lg:ml-0 mt-2 lg:mt-2">
        <Switch
          checked={isSecondOrderActive}
          onCheckedChange={handleSecondOrderToggle}
          // Add additional Shadcn Switch props as needed
        />
        <label
          className="toggle-label relative -top-0.5 whitespace-nowrap"
          onClick={handleSecondOrderToggle}
        >
          {" "}
          War Outbreak
        </label>
      </div>
    </div>
  );
};

const Map = ({
  rotation,
  scale,
  projectionType,
  geographiesData,
  state,
  handleCountryClick,
  getCountryColor,
}) => {
  const width = 800;
  const height = 600;

  const projection = geoRobinson()
    .translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotation);
  return (
    <div className="bg-slate-400">
      <ComposableMap
        viewBox="-80 -10 1000 550" // 0 0 800 450
        projection={projection}
        projectionConfig={{
          rotate: rotation,
          scale: 200,
        }}
      >
        <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
        <Graticule stroke="#E4E5E6" strokeWidth={0.3} />
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
                  strokeWidth={0.15}
                  style={{
                    default: {
                      fill: countryState.color, // Use the state to get the color
                      outline: "none",
                    },
                    hover: {
                      fill: countryState.color, // Use the state to get the color for hover as well
                      outline: "none",
                    },
                    pressed: {
                      fill: countryState.color, // Use the state to get the color for pressed state too
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
