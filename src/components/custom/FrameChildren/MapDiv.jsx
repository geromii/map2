"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import useCountryStore from "@/app/useCountryStore";
import {
  ComposableMap,
  Sphere,
  Graticule,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { geoRobinson } from "d3-geo-projection";
import { Tooltip, TooltipRefProps } from "react-tooltip";
import { IconInfoCircle } from "@tabler/icons-react";
import { getCountryEmoji } from "src/utils/countryEmojis";
import { IconX } from "@tabler/icons-react";

export const MapDiv = ({ mapMode }) => {
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [maxZoom, setMaxZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 2 }));
  }
  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 2 }));
  }
  function handleMoveEnd(position) {
    setPosition(position);
  }
  const mapRef = useRef(null);

  //sets x and y of click location when click happens
  const [clickLocation, setClickLocation] = useState({ x: 0, y: 0 });

  // detect current coords of mouse, if more than 50 px away from clickLocation, set clickLocation to null

  useEffect(() => {
    const handleMouseMove = (event) => {
      const distance = Math.sqrt(
        Math.pow(event.clientX - clickLocation.x, 2) +
          Math.pow(event.clientY - (clickLocation.y + 10), 2)
      );

      if (distance > 65 ) {
        // Close the tooltip if the distance is more than 50px
        tooltipRef1.current?.close();
        tooltipRef2.current?.close();
        tooltipRef3.current?.close();
        // Optionally reset click location to avoid repeated closings
      }
    };

    // Add event listener
    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [clickLocation]);

  // Detect device type (mobile vs. desktop) and set appropriate maxZoom

  useEffect(() => {
    const matchMedia = window.matchMedia("(pointer: coarse)");
    const handleChange = () => setIsMobile(matchMedia.matches);

    matchMedia.addEventListener('change', handleChange);

    // Initial state setup
    setIsMobile(matchMedia.matches);

    return () => matchMedia.removeEventListener('change', handleChange);
  }, []);

  // Use isMobile as needed
  useEffect(() => {
    setMaxZoom(isMobile ? 8 : 1);
  }, [isMobile]); // Re-run when isMobile changes

  const { resetAllExcept } = useCountryStore((state) => ({
    resetAllExcept: state.resetAllExcept,
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


  useEffect(() => {
    fetch("/features.json")
      .then((response) => response.json())
      .then((data) => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);




  const tooltipRef1 = useRef(null);
  const tooltipRef2 = useRef(null);
  const tooltipRef3 = useRef(null);
  const tooltipRef4 = useRef(null);
  const tooltipRef5 = useRef(null);

  const handleCountryClick = (country, event) => {
    setClickLocation({
      x: event.clientX,
      y: event.clientY,
    });
    if (mapMode == "single") {
      // if the country state is 2, reset all countries, if the country state is not 2, set it it to 2
      if (countries[country].phase == 2) {
        resetAllExcept();
      } else {
        resetAllExcept();
        setCountryPhase(country, 2);
      }
    } else {
      tooltipRef1.current?.open();
      tooltipRef2.current?.open();
      tooltipRef3.current?.open();
    }
  };

  // phase 2 countries, if there are 27 phase 2 countries replace with European Union
  let phase2Countries = Object.keys(countries).filter(
    (key) => countries[key].phase === 2
  );
  if (phase2Countries.length === 27) {
    phase2Countries = ["European Union"];
  }

  const scale = "180";
  const rotation = [-12.5];

  const width = 800;
  const height = 600;

  const projection = geoRobinson()
    .translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotation);
  return (
    <div
      ref={mapRef}
      className="relative map-container w-full h-full select-none transition"
    >

      <div className=" bg-slate-500  lg:rounded  shadow-sm   ">
        <ComposableMap
          viewBox="-80 -10 1000 540"
          projection={projection}
          projectionConfig={{
            rotate: rotation,
            scale: 195,
          }}
        >
          <defs>
            <pattern
              id="bg-pattern"
              x="0"
              y="0"
              width="40"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <image
                href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 28' width='56' height='28'%3E%3Cpath fill='%23ffffff' fill-opacity='0.065' d='M56 26v2h-7.75c2.3-1.27 4.94-2 7.75-2zm-26 2a2 2 0 1 0-4 0h-4.09A25.98 25.98 0 0 0 0 16v-2c.67 0 1.34.02 2 .07V14a2 2 0 0 0-2-2v-2a4 4 0 0 1 3.98 3.6 28.09 28.09 0 0 1 2.8-3.86A8 8 0 0 0 0 6V4a9.99 9.99 0 0 1 8.17 4.23c.94-.95 1.96-1.83 3.03-2.63A13.98 13.98 0 0 0 0 0h7.75c2 1.1 3.73 2.63 5.1 4.45 1.12-.72 2.3-1.37 3.53-1.93A20.1 20.1 0 0 0 14.28 0h2.7c.45.56.88 1.14 1.29 1.74 1.3-.48 2.63-.87 4-1.15-.11-.2-.23-.4-.36-.59H26v.07a28.4 28.4 0 0 1 4 0V0h4.09l-.37.59c1.38.28 2.72.67 4.01 1.15.4-.6.84-1.18 1.3-1.74h2.69a20.1 20.1 0 0 0-2.1 2.52c1.23.56 2.41 1.2 3.54 1.93A16.08 16.08 0 0 1 48.25 0H56c-4.58 0-8.65 2.2-11.2 5.6 1.07.8 2.09 1.68 3.03 2.63A9.99 9.99 0 0 1 56 4v2a8 8 0 0 0-6.77 3.74c1.03 1.2 1.97 2.5 2.79 3.86A4 4 0 0 1 56 10v2a2 2 0 0 0-2 2.07 28.4 28.4 0 0 1 2-.07v2c-9.2 0-17.3 4.78-21.91 12H30zM7.75 28H0v-2c2.81 0 5.46.73 7.75 2zM56 20v2c-5.6 0-10.65 2.3-14.28 6h-2.7c4.04-4.89 10.15-8 16.98-8zm-39.03 8h-2.69C10.65 24.3 5.6 22 0 22v-2c6.83 0 12.94 3.11 16.97 8zm15.01-.4a28.09 28.09 0 0 1 2.8-3.86 8 8 0 0 0-13.55 0c1.03 1.2 1.97 2.5 2.79 3.86a4 4 0 0 1 7.96 0zm14.29-11.86c1.3-.48 2.63-.87 4-1.15a25.99 25.99 0 0 0-44.55 0c1.38.28 2.72.67 4.01 1.15a21.98 21.98 0 0 1 36.54 0zm-5.43 2.71c1.13-.72 2.3-1.37 3.54-1.93a19.98 19.98 0 0 0-32.76 0c1.23.56 2.41 1.2 3.54 1.93a15.98 15.98 0 0 1 25.68 0zm-4.67 3.78c.94-.95 1.96-1.83 3.03-2.63a13.98 13.98 0 0 0-22.4 0c1.07.8 2.09 1.68 3.03 2.63a9.99 9.99 0 0 1 16.34 0z'%3E%3C/path%3E%3C/svg%3E"
                width="40px"
                height="20px"
              />
            </pattern>
          </defs>
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            translateExtent={[
              [-80, -10],
              [920, 530],
            ]} // first array is the top left corner, second array is the bottom right corner
            onMoveEnd={handleMoveEnd}
            maxZoom={maxZoom}
          >
            <rect
              // background rectangle so that it moves with the map on mobile
              x="-500"
              y="-500"
              width="2000"
              height="1540"
              fill="url(#bg-pattern)"
            />
            <Sphere stroke="#E4E5E6" strokeWidth={0} className="mapbg" />
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
                          aria-label={`Heat map data for ${geo.properties.name}, value of ${countryState.probability}`}
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={(e) =>
                            handleCountryClick(geo.properties.name, e)
                          }
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
                          onClick={(e) =>
                            handleCountryClick(geo.properties.name, e)
                          }
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
          </ZoomableGroup>
        </ComposableMap>
      </div>
      {!isMobile && <>
        <Tooltip id="my-tooltip" float="true" delayShow="700" />
      <Tooltip
        arrowColor="white"
        ref={tooltipRef1}
        id="my-tooltip"
        float={false}
        openOnClick={true}
        position={{ x: clickLocation.x, y: clickLocation.y }}
        place="right"
        opacity={1.0}
        clickable={true}
        style={{ padding: "0px 0px 0px 0px", backgroundColor: "transparent" }}
        globalCloseEvents={{
          scroll: true,
          resize: false,
          clickOutsideAnchor: true,
        }}
        render={({ content, activeAnchor }) => (
          <div
            onClick={() => {
              setCountryPhase(content, 3);
              tooltipRef1.current?.close();
            }}
            className="w-9 h-9 bg-red-600 ring-2 ring-white hover:bg-red-700 rounded-full cursor-pointer z-20 shadow-lg"
          ></div>
        )}
      />
      <Tooltip
        arrowColor="white"
        ref={tooltipRef2}
        id="my-tooltip"
        float={false}
        openOnClick={true}
        position={{ x: clickLocation.x, y: clickLocation.y }}
        place="left"
        opacity={1.0}
        clickable={true}
        style={{ padding: "0px 0px 0px 0px", backgroundColor: "transparent" }}
        globalCloseEvents={{
          scroll: true,
          resize: false,
          clickOutsideAnchor: true,
        }}
        render={({ content, activeAnchor }) => (
          <div
            onClick={() => {
              setCountryPhase(content, 2);
              tooltipRef2.current?.close();
            }}
            className="w-9 h-9 bg-blue-600 ring-2 ring-white hover:bg-blue-700 rounded-full cursor-pointer z-[200] shadow-lg"
          ></div>
        )}
      />
      <Tooltip
        arrowColor="white"
        offset={16}
        ref={tooltipRef3}
        id="my-tooltip"
        float={false}
        openOnClick={true}
        position={{ x: clickLocation.x, y: clickLocation.y }}
        place="bottom"
        opacity={1.0}
        clickable={true}
        style={{ padding: "0px 0px 0px 0px", backgroundColor: "transparent" }}
        globalCloseEvents={{
          scroll: true,
          resize: false,
          clickOutsideAnchor: false,
        }}
        render={({ content, activeAnchor }) => (
          <div className="flex">
            <div
              onClick={() => {
                setCountryPhase(content, 0);
                tooltipRef3.current?.close();
              }}
              className="w-5 h-5 bg-gray-300 ring-1 ring-white hover:bg-gray-200 cursor-pointer z-[200] text-red-500 flex justify-center items-center rounded-l-xl shadow"
            >
              <IconX />
            </div>
            <div
              onClick={() => {
                setCountryPhase(content, 1);
                tooltipRef3.current?.close();
              }}
              className="w-5 h-5 bg-gray-600 ring-1 ring-white hover:bg-gray-700 cursor-pointer z-[200] rounded-r-xl shadow"
            ></div>
          </div>
        )}
      />
      </>}
      {isMobile && <>

        <Tooltip
                ref={tooltipRef4}
        arrowColor="white"
        offset={6}
        id="my-tooltip"
        float={false}
        openOnClick={true}
        position={{ x: clickLocation.x, y: clickLocation.y }}
        place="top"
        opacity={1.0}
        clickable={true}
        style={{ padding: "0px 0px 0px 0px", backgroundColor: "transparent" }}
        globalCloseEvents={{
          scroll: true,
          resize: true,
          clickOutsideAnchor: true,
        }}
        render={({ content, activeAnchor }) => (
          <div className="flex">
            <div
              onClick={() => {
                setCountryPhase(content, 2);
                tooltipRef4.current?.close();
              }}
              className="w-8 h-8 bg-blue-500 ring-2 ring-white hover:bg-blue-700 cursor-pointer z-[200] text-red-500 flex justify-center items-center rounded-l-xl shadow"
            >
            </div>
            <div
              onClick={() => {
                setCountryPhase(content, 3);
                tooltipRef4.current?.close();
              }}
              className="w-8 h-8 bg-red-500 ring-2 ring-white hover:bg-red-700 cursor-pointer z-[200] rounded-r-xl shadow"
            ></div>
          </div>
        )}
      />
      

        <Tooltip
        arrowColor="white"
        ref={tooltipRef5}
        offset={6}
        id="my-tooltip"
        float={false}
        openOnClick={true}
        position={{ x: clickLocation.x, y: clickLocation.y }}
        place="bottom"
        opacity={1.0}
        clickable={true}
        style={{ padding: "0px 0px 0px 0px", backgroundColor: "transparent" }}
        globalCloseEvents={{
          scroll: true,
          resize: true,
          clickOutsideAnchor: true,
        }}
        render={({ content, activeAnchor }) => (
          <div className="flex">
            <div
              onClick={() => {
                setCountryPhase(content, 0);
                tooltipRef5.current?.close();
              }}
              className="w-5 h-5 bg-gray-300 ring-1 ring-white hover:bg-gray-400 cursor-pointer z-[200] text-red-500 flex justify-center items-center rounded-l-xl shadow"
            >
              <IconX />
            </div>
            <div
              onClick={() => {
                setCountryPhase(content, 1);
                tooltipRef5.current?.close();
              }}
              className="w-5 h-5 bg-gray-600 ring-1 ring-white hover:bg-gray-700 cursor-pointer z-[200] rounded-r-xl shadow"
            ></div>
          </div>
        )}
      />
      
      
      </>}


      <div
        data-mapmode={mapMode}
        className="lg:hidden data-[mapmode=multi]:hidden w-full"
      >
        <p className="font-semibold font-serif text-lg text-center h-8 bg-slate-100 border-2">
          {phase2Countries
            .map((country) => `${getCountryEmoji(country)} ${country}`)
            .join(", ")}
        </p>
      </div>
    </div>
  );
};

const testWrapper = ({ children }) => {
  const testFunction = () => {
    console.log("test");
  };
  return <div onClick={() => testFunction()}>{children}</div>;
};
