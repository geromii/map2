"use client";

import React from "react";
import { useState, useEffect } from "react";
import useCountryStore from "@/app/useCountryStore";
import {
  ComposableMap,
  Sphere,
  Graticule,
  Geographies,
  Geography,
} from "react-simple-maps";
import { geoRobinson } from "d3-geo-projection";
import { Tooltip } from "react-tooltip"; 
import { IconInfoCircle } from "@tabler/icons-react";


export const MapDiv = ({}) => {
  const { resetAllExcept } = useCountryStore((state) => ({
    resetAllExcept: state.resetAllExcept,
  }));
  const { mapMode } = useCountryStore((state) => ({
    mapMode: state.mapMode,
  }));
  const { setCountryPhase } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase,
  }));

  const { countries, incrementCountryPhase } = useCountryStore((state) => ({
    countries: state.countries,
    incrementCountryPhase: state.incrementCountryPhase,
  }));

  const [geographiesData, setGeographiesData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userHasCycledColours, setUserHasCycledColours] = useState(false)
  const [fadeOutPopup, setFadeOutPopup] = useState(false)

  useEffect(() => {
    fetch("/features.json")
      .then((response) => response.json())
      .then((data) => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);

  // if a country exists in phase 2 or 3, set userHasCycledColours to true
  useEffect(() => {
    
    const phaseThreeCountries = Object.values(countries).filter(
      (c) => c.phase === 3
    ).length;
    if (mapMode != "single" && phaseThreeCountries > 0 ) {
      setUserHasCycledColours(true)
    }
  }, [countries, mapMode]);


  // this is for the guide popup when users click 3 countries into phase 1 whithout clicking any country into phase 2 or phase 3
  useEffect(() => {
    const phaseOneCountries = Object.values(countries).filter(
      (c) => c.phase === 1
    ).length;
    const phaseTwoCountries = Object.values(countries).filter(
      (c) => c.phase === 2
    ).length;
    const phaseThreeCountries = Object.values(countries).filter(
      (c) => c.phase === 3
    ).length;
    // only trigger if there are no phase 2 or phase 3 countries and if userHasCycledCountries is false
    if (phaseOneCountries == 2 && phaseTwoCountries === 0 && phaseThreeCountries === 0 && !userHasCycledColours) {
      setShowPopup(true);
    } else if (phaseOneCountries === 0 || phaseOneCountries > 2 ||  phaseTwoCountries > 0 ||  phaseThreeCountries > 0) {
      setFadeOutPopup(true)
      setTimeout(() => {
        setShowPopup(false);
        setFadeOutPopup(false)
      }, 500);
    }
  }, [countries]);


 
  const handleCountryClick = (country) => {
    if (mapMode == "single") {
      // if the country state is 2, reset all countries, if the country state is not 2, set it it to 2
      if (countries[country].phase == 2) {
        resetAllExcept();
      } else {
        resetAllExcept();
        setCountryPhase(country, 2);
      }
    } else {
      incrementCountryPhase(country);
    }
  };

  const scale = "180";
  const rotation = [-12.5];

  const width = 800;
  const height = 600;

  const projection = geoRobinson()
    .translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotation);
  return (
    <div className=" map-container w-full h-full select-none transition">
      {showPopup && mapMode != "single" && (
        <div className="fixed inset-0 m-auto w-80 h-100 rounded-full flex justify-center items-center z-50 ">
          <div data-animation = {showPopup} data-fadeout = {fadeOutPopup} className="bg-yellow-400  flex items-center p-4 rounded-lg shadow-2xl relative data-[animation=true]:animate-fadeIn data-[fadeout=true]:opacity-0 transition duration-300  ">
            <button
              className="absolute top-0 right-1 text-2xl font-bold"
              onClick={() => setShowPopup(false)}
            >
              ×
            </button>
            <IconInfoCircle size = {40} className = "mr-2 w-14"/> <p>Click a country again to cycle through colors. From grey to red to blue.</p>
          </div>
        </div>
      )}

      <div className="mapbg bg-slate-500 rounded scale-x-[1.01] shadow-sm   sm:scale-[1.0]">
        <ComposableMap
          viewBox="-80 -10 1000 540"
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
                  countries[geo.properties.name].phase !== 2 &&
                  countries[geo.properties.name].phase !== 3
              );
              const highlightedCountries = geographies.filter(
                (geo) =>
                  countries[geo.properties.name].phase === 2 ||
                  countries[geo.properties.name].phase === 3
              );
              // this is so that the countries that are in phase 2 or 3 are drawn on top of the other countries
              // if this isnt done then the borders get wonky, and even if the borders are thickened they are still "under" the other countries
              return (
                <>
                  {remainingCountries.map((geo) => {
                    const countryState = countries[geo.properties.name];
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
                    const countryState = countries[geo.properties.name];
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
                        data-tooltip-content={geo.properties.name}
                      />
                    );
                  })}
                </>
              );
            }}
          </Geographies>
        </ComposableMap>
      </div>
      <Tooltip id="my-tooltip" float="true" delayShow="800" />
    </div>
  );
};
