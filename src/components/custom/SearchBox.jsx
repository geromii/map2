"use client";

import * as React from "react";
import { SearchCountry } from "./SearchCountry";
import useCountryStore from "@/app/useCountryStore";
import { X } from "lucide-react";

export function SearchBox() {
  const { setCountryPhase, countries } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase,
    countries: state.countries,
  }));

  const phaseStyles = {
    0: "text-gray-400",
    1: "text-gray-600",
    2: "text-blue-700 font-semibold",
    3: "text-red-700 font-semibold",
  };

  const handleClose = (country) => {
    setCountryPhase(country, 0);
  };

  const selectedCountries = Object.entries(countries)
    .filter(([_, country]) => country.nonInitial)
    .sort(([, a], [, b]) => a.selectionOrder - b.selectionOrder);

  return (
    <div className="w-full h-full flex flex-col">
      <SearchCountry countries={countries} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden mt-1">
        {selectedCountries.length > 0 && (
          <div className="space-y-0">
            {selectedCountries.map(([countryName, country]) => (
              <div
                key={countryName}
                className="flex items-center gap-1.5 py-0.5 px-0.5 rounded hover:bg-gray-50"
              >
                <button
                  onClick={() => handleClose(countryName)}
                  className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remove"
                >
                  <X size={12} />
                </button>
                <PhaseButtons
                  country={countryName}
                  currentPhase={country.phase}
                  setCountryPhase={setCountryPhase}
                />
                <span
                  className={`text-sm truncate ${phaseStyles[country.phase]}`}
                  title={countryName}
                >
                  {countryName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseButtons({ setCountryPhase, country, currentPhase }) {
  const phases = [
    { phase: "neutral", color: "bg-gray-500", ring: currentPhase === 1 },
    { phase: "blue", color: "bg-blue-700", ring: currentPhase === 2 },
    { phase: "red", color: "bg-red-700", ring: currentPhase === 3 },
  ];

  return (
    <div className="flex gap-px flex-shrink-0">
      {phases.map(({ phase, color, ring }) => (
        <button
          key={phase}
          onClick={() => setCountryPhase(country, phase)}
          className={`w-3.5 h-3.5 rounded-sm ${color} transition-all ${
            ring ? "ring-1 ring-offset-1 ring-yellow-400" : "hover:opacity-80"
          }`}
          title={`Set to ${phase}`}
        />
      ))}
    </div>
  );
}
