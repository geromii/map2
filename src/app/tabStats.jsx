import React, { useState, useEffect } from "react";
import { IconInfoCircle, IconArrowBigDownFilled } from "@tabler/icons-react";

import useCountryStore from "./useCountryStore";
import { getCountryEmoji } from "../utils/countryEmojis";

function TabStats({ pageMode, sortedCountries, phase2Countries, phase3Countries, phase2exists, phase3exists, displayStats }) {

  return (
    <div className="flex items-center justify-around w-full h-[130px] lg:h-[10.02vw] -translate-y-2">
        


      <div
        data-display={displayStats}
        className="text-center w-full transition data-[display=false]:opacity-0 duration-200 "
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



export default TabStats;
