"use client"

import React from "react";
import { useState, useEffect } from "react";
import useCountryStore from "@/app/useCountryStore";
import { ComposableMap, Sphere, Graticule, Geographies, Geography } from "react-simple-maps";
import { geoRobinson } from "d3-geo-projection";



export const MapDiv = ({
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

  const {
    countries,
    incrementCountryPhase,
  } = useCountryStore((state) => ({
    countries: state.countries,
    incrementCountryPhase: state.incrementCountryPhase,
  }));

  const [geographiesData, setGeographiesData] = useState([]);

  useEffect(() => {
    fetch("/features.json")
      .then((response) => response.json())
      .then((data) => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);



  const handleCountryClick = (country) => {
    if (mapMode == "single") {
      resetAllExcept()
      setCountryPhase(country, 2);
    } else {
      incrementCountryPhase(country);
    }
  };

  const scale = "180"
  const rotation = [-12.5]

  const width = 800;
  const height = 600;

  const projection = geoRobinson()
    .translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotation);
    return (
      <div className="mapbg bg-slate-500 rounded scale-x-[1.01] shadow border sm:translate-y-2  sm:scale-x-100">
        <ComposableMap
          viewBox="-80 -20 1000 550"
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
                        data-tooltip-content= {geo.properties.name}
                      />
                    );
                  })}
                </>
              );
            }}
          </Geographies>
        </ComposableMap>
      </div>
    );
};
