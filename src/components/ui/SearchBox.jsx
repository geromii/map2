"use client";

import * as React from "react";
import { useState } from "react";
import { SearchCountry } from "./SearchCountry";
import useCountryStore from "@/app/useCountryStore";

export function SearchBox() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  let reversedCountries = [...selectedCountries].reverse();
  const { setCountryPhase } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase,
  }));

  const handleClose = (country) => {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
  };

  return (
    <div className="w-full h-full m-1 flex flex-col pt-1 md:p-0.5 lg:p-1">
      <SearchCountry
        selectedCountries={selectedCountries}
        setSelectedCountries={setSelectedCountries}
      />
      <div className="flex flex-col w-full items-start overflow-scroll">
        <div
          className=" mt-3 h-full w-full"
          style={{ maxHeight: "calc(100% - 1.5rem)" }}
        >
          {reversedCountries.map((country) => (
            <div
              key={country}
              className="flex justify-between items-center whitespace-nowrap font-semibold"
            >
              <div className="flex mr-1 relative">
                <Squares country={country} setCountryPhase={setCountryPhase} />
              </div>
              <div className="truncate text-sm" title={country}>
                {" "}
                {country}
              </div>
              <div className="">
                <button onClick={() => handleClose(country)} className="flex text-red-500 scale-x-[1.1]">X</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// both from Tabler Icons

function Squares({
  scale = 1,
  setCountryPhase,
  country,
}) {
  // Define a common style for all buttons, excluding the backgroundColor
  const commonStyle = {
    transform: `scale(${scale})`,
    marginRight: "-2px", // Assuming you want some space between buttons
    border: "1px solid #000000",
  };

  let swatchClassNames = "w-4 h-4"

  // Define an array of color codes for your buttons
  const colors = ["#cccccc", "#990000", "#000099", "#646464"];

  return (
    <>
      <button
        style={{ ...commonStyle, backgroundColor: colors[0] }}
        onClick={() => setCountryPhase(country, 0)}
        className={swatchClassNames}
      ></button>
      <button
        style={{ ...commonStyle, backgroundColor: colors[1] }}
        onClick={() => setCountryPhase(country, 1)}
        className={swatchClassNames}
      />
      <button
        style={{ ...commonStyle, backgroundColor: colors[2] }}
        onClick={() => setCountryPhase(country, 2)}
        className={swatchClassNames}
      />
      <button
        style={{ ...commonStyle, backgroundColor: colors[3] }}
        onClick={() => setCountryPhase(country, 3)}
        className={swatchClassNames}
      />
    </>
  );
}
