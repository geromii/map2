import React, { useState, useEffect } from "react";
import { IconArrowBigDownLinesFilled } from "@tabler/icons-react";

import useCountryStore from "./useCountryStore";
import { getCountryEmoji } from "../utils/countryEmojis";

function TabStats({ pageMode }) {
  const [sortedCountries, setSortedCountries] = useState([]);
  const [phase2Countries, setPhase2Countries] = useState([]);
  const [phase3Countries, setPhase3Countries] = useState([]);

  const countries = useCountryStore((state) => state.countries);

  useEffect(() => {
    // Logic to update phase 2 and phase 3 countries
    const phase2 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 2)
      .map(([key, _]) => key);
    const phase3 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 3)
      .map(([key, _]) => key);

    setPhase2Countries(phase2);
    setPhase3Countries(phase3);

    const updateStats =
      pageMode === "single"
        ? phase2.length > 0 || phase3.length > 0
        : phase2.length > 0 && phase3.length > 0;
    // Update sortedCountries only if there are entries in phase2 or phase3
    if (updateStats) {
      const phase0Countries = Object.entries(countries).filter(
        ([_, value]) => value.phase === 0
      );

      const sorted = phase0Countries
        .sort((a, b) => a[1].probability - b[1].probability)
        .map((entry) => ({
          country: entry[0],
          probability: entry[1].probability,
        }));

      const top3 = sorted.slice(0, 4);
      const bottom3 = sorted.slice(-4).reverse();

      setSortedCountries([...top3, ...bottom3]);
    }
  }, [countries]);

  // same logic as updateState
  const displayStats =
    pageMode === "single"
      ? phase2Countries.length > 0 || phase3Countries.length > 0
      : phase2Countries.length > 0 && phase3Countries.length > 0;

  const phase2exists = phase2Countries.length > 0;
  const phase3exists = phase3Countries.length > 0;
  return (
    <div className="flex items-center justify-around w-full h-[130px] lg:h-[10.02vw]">
      <div
        data-display={displayStats}
        className="absolute data-[display=true]:opacity-0 data-[display=true]:translate-y-3 transition duration-[250ms] w-[70%]"
      >
        <NoCountrySelected pageMode={pageMode} phase2Exists={phase2exists} phase3Exists={phase3exists} />
      </div>

      <div
        data-display={displayStats}
        className="text-center w-full transition data-[display=false]:opacity-0  "
      >
        <div className="text-sm xl:text-base 2xl:text-lg flex justify-around w-full  items-center align-middle pb-1">
          <div className="hidden lg:flex w-1/6 justify-center">
            <table className="text-xl font-semibold">
              <tbody>
                {phase2Countries.map((country, index) => (
                  <tr key={index}>
                    <td>{getCountryEmoji(country)}</td>
                    <td>{country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex w-full lg:w-6/12 items-center align-center justify-between h-full ">
            <table className="w-full table-fixed ">
              <tbody>
                {sortedCountries.slice(-4).map((entry, index) => (
                  <tr key={index}>
                    <td className="w-4/12 md:w-3/12 lg:w-4/12 text-left font-mono truncate">
                      {entry.probability.toFixed(2)}{" "}
                      {getCountryEmoji(entry.country)}
                      <span className="truncate font-sans">
                        {entry.country}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full table-fixed ">
              <tbody>
                {sortedCountries.slice(0, 4).map((entry, index) => (
                  <tr key={index}>
                    <td className="w-4/12 md:w-3/12 lg:w-4/12 text-left font-mono truncate">
                      {entry.probability.toFixed(2)}{" "}
                      {getCountryEmoji(entry.country)}
                      <span className="truncate font-sans">
                        {entry.country}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hidden lg:flex w-1/6">
            <table className="text-xl font-semibold">
              <tbody>
                {phase3Countries.map((country, index) => (
                  <tr key={index}>
                    <td>{getCountryEmoji(country)}</td>
                    <td>{country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const NoCountrySelected = ({ pageMode = "single", phase2Exists, phase3Exists }) => {
  return pageMode === "single" ? (
    <div className="flex justify-center align-top w-full translate-y-5 text-lg items-center drop-shadow">
      <div className="flex p-2 bg-yellow-400 rounded-full shadow-lg font-medium items-center text-base">
        <IconArrowBigDownLinesFilled
          size={22}
          className="text-primary drop-shadow"
        />{" "}
        Click a country below...
      </div>
    </div>
  ) : (
    
    
    <div className="flex justify-around  w-full translate-y-5 text-lg  drop-shadow transition">
      <div data-phase2exists = {phase2Exists}
      className="flex p-2 bg-blue-500 rounded-full  font-medium items-center text-base data-[phase2exists=true]:opacity-0 data-[phase2exists=true]:translate-y-2 transition-all delay-50 duration-300">
        <IconArrowBigDownLinesFilled
          size={22}
          className="text-primary drop-shadow-lg"
        />{" "}
        Select a blue country below...
      </div>
      <div data-phase3exists = {phase3Exists}
      className="flex p-2 bg-red-500 rounded-full  font-medium items-center text-base data-[phase3exists=true]:opacity-0 data-[phase3exists=true]:translate-y-2  transition-all delay-50 duration-300">
        <IconArrowBigDownLinesFilled
          size={22}
          className="text-primary drop-shadow-lg"
        />{" "}
        Select a red country below...
      </div>
    </div>
  );
};

export default TabStats;
