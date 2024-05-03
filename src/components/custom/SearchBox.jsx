"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { SearchCountry } from "./SearchCountry";
import useCountryStore from "@/app/useCountryStore";
import { IconSquareX } from "@tabler/icons-react";

export function SearchBox() {
  const { setCountryPhase, countries } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase,
    countries: state.countries,
  }));

  const phaseColorMap = {
    0: "#cccccc",
    1: "#474747",
    2: "#000099",
    3: "#990000",
  };

  const handleClose = (country) => {
    setCountryPhase(country, 0);
  };

  return (
    <div className="w-full h-full m flex flex-col pt-1 md:p-0.5 lg:p-0">
      <SearchCountry countries={countries} />
      <div className="flex flex-col w-full h-full items-start overflow-y-scroll overflow-x-hidden">
        <div
          className=" mt-3 h-full w-full"
          style={{ maxHeight: "calc(100% - 1.5rem)" }}
        >
          {Object.entries(countries) // Change from Object.values to Object.entries
            .filter(([_, country]) => country.nonInitial) // Destructure to get the country object
            .sort(([, a], [, b]) => a.selectionOrder - b.selectionOrder) // Adjust sort to handle entries
            .map(
              (
                [countryName, country] // Destructure to get countryName and country
              ) => (
                <div
                  key={countryName} // Use countryName as the key
                  className="flex space-x-1 items-center whitespace-nowrap font-semibold border-b-1 mt-[-2px] border-accent"
                >
                  <div className="flex relative shadow-sm space items-center">
                  <button
                      onClick={() => handleClose(countryName)} // Pass countryName handleClose function
                      className="flex text-red-500"
                    >
                      <IconSquareX  size = {19} />
                    </button>
                    <Squares
                      country={countryName} // Pass countryName here
                      setCountryPhase={setCountryPhase}
                    />
                  </div>
                  <div className=""></div>
                  <div
                    className="truncate text-sm"
                    style={{ color: phaseColorMap[country.phase] }}
                    title={countryName}
                  >
                    {countryName}
                  </div>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}

// both from Tabler Icons

function Squares({ scale = 1, setCountryPhase, country }) {
  // Define a common style for all buttons, excluding the backgroundColor
  const commonStyle = {
    transform: `scale(${scale})`,
    marginRight: "-2px",
    border: "1px solid #000000",
  };

  let swatchClassNames = "w-4 h-4";

  // Define an array of color codes for your buttons
  const colors = ["#cccccc", "#990000", "#000099", "#646464"];

  return (
    <div className= "flex">
      <button
        style={{ ...commonStyle, backgroundColor: colors[3] }}
        onClick={() => setCountryPhase(country, "neutral")}
        className={swatchClassNames}
      />
      <button
        style={{ ...commonStyle, backgroundColor: colors[2] }}
        onClick={() => setCountryPhase(country, "blue")}
        className={swatchClassNames}
      />
      <button
        style={{ ...commonStyle, backgroundColor: colors[1] }}
        onClick={() => setCountryPhase(country, "red")}
        className={swatchClassNames}
      />
    </div>
  );
}
