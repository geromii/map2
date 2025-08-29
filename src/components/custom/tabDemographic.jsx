import React, { useState, useEffect } from "react";
import useCountryStore from "../../app/useCountryStore";
import { CardContent } from "@/components/ui/card";
import { Switch } from "../ui/switch";
import { demographics } from "../../data/appData";

function TabDemographic({ phase2Countries, phase3Countries, pageMode, displayStats }) {
  const [aggregatedData, setAggregatedData] = useState({
    phase2: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 },
    phase3: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 },
  });
  const [demographicsData] = useState(demographics);
  const countries = useCountryStore((state) => state.countries);
  const [includeAllies, setIncludeAllies] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phase2AlliesArray, setPhase2AlliesArray] = useState(0);
  const [phase3AlliesArray, setPhase3AlliesArray] = useState(0);
  const [allyThreshold, setAllyThreshold] = useState(1);

  // if pageMode changes to single, set includeAllies to false
  useEffect(() => {
    if (pageMode == "single") {
      setIncludeAllies(false);
    }
  }, [pageMode]);

  useEffect(() => {
    if (!demographicsData) return; // Skip processing if data is not loaded yet

    let phase2Allies = [];
    let phase3Allies = [];

    const aggregation = demographicsData.reduce(
      (acc, item) => {
        const phase = countries[item.Country]?.phase;
        const preferenceScore = countries[item.Country]?.preferenceScore;

        if (phase === 2 || phase === 3) {
          acc[`phase${phase}`].countries.push(item.Country);
          acc[`phase${phase}`].GDP += item.GDP;
          acc[`phase${phase}`].GDP_PPP += item.GDP_PPP;
          acc[`phase${phase}`].Population += item.Population;
          acc[`phase${phase}`].Area += item.Area;
        }
        if (includeAllies && preferenceScore > allyThreshold && phase === 0) {
          phase2Allies.push(item.Country);
          acc[`phase2`].countries.push(item.Country);
          acc[`phase2`].GDP += item.GDP;
          acc[`phase2`].GDP_PPP += item.GDP_PPP;
          acc[`phase2`].Population += item.Population;
          acc[`phase2`].Area += item.Area;
        }
        if (includeAllies && preferenceScore < -allyThreshold && phase === 0) {
          phase3Allies.push(item.Country);
          acc[`phase3`].countries.push(item.Country);
          acc[`phase3`].GDP += item.GDP;
          acc[`phase3`].GDP_PPP += item.GDP_PPP;
          acc[`phase3`].Population += item.Population;
          acc[`phase3`].Area += item.Area;
        }
        return acc;
      },
      {
        phase2: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 },
        phase3: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 },
      },
    );

    // Update state once after all calculations are done
    setPhase2AlliesArray(phase2Allies);
    setPhase3AlliesArray(phase3Allies);
    setAggregatedData(aggregation);
  }, [demographicsData, countries, includeAllies, allyThreshold]);

  const formatMoney = (value) => {
    const trillion = value / 1e6; // Convert to trillion
    if (value == 0) {
      return "$0.00";
    }
    if (trillion >= 1) {
      return `$${trillion.toFixed(2)} trillion`;
    } else {
      const billion = value / 1e3; // Convert to billion
      return `$${billion.toFixed(0)} billion`;
    }
  };

  const formatPopulation = (population) => {
    if (population == 0) {
      return "0";
    }
    if (population >= 1e9) {
      return `${(population / 1e9).toFixed(1)} billion`;
    } else {
      return `${(population / 1e6).toFixed(1)} million`;
    }
  };

  const formatArea = (area) => area.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const hideStats = pageMode != "single" && displayStats == false;

  if (isLoading) {
    return (
      <div data-hidedemographics={hideStats} className="w-full h-full flex justify-center items-center data-[hidedemographics=true]:opacity-0">
        Loading...
      </div>
    );
  }

  const phase2Data = aggregatedData.phase2;
  const phase3Data = aggregatedData.phase3;

  // condition that is true if pageMode == single and displayStats == false

  const handleRadioChange = (e) => {
    setAllyThreshold(parseFloat(e.target.value));
  };

  console.log(phase2AlliesArray);

  const phase2AlliesTooltip = phase2AlliesArray.length > 0 ? phase2AlliesArray.join(", ") : "None";
  const phase3AlliesTooltip = phase3AlliesArray.length > 0 ? phase3AlliesArray.join(", ") : "None";
  console.log("Phase 2 Allies", phase2AlliesTooltip);
  console.log("Phase 3 Allies", phase3AlliesTooltip);

  return (
    <CardContent data-hidedemographics={hideStats} className=" data-[hidedemographics=true]:opacity-0 transition duration-75">
      {pageMode != "single" ? (
        <div className="w-full flex justify-around">
          <div className="flex items-top text-sm xl:text-base">
            <label className="text-sm xl:text-base font-medium">Include Allies:</label>
            <div className="ml-2">
              <input
                type="radio"
                id="option0"
                name="allyThreshold"
                value="0"
                checked={includeAllies == false}
                onChange={(e) => {
                  setIncludeAllies(false);
                }}
              />
              <label htmlFor="option0" className="ml-1">
                Off
              </label>
            </div>
            <div className="ml-2">
              <input
                type="radio"
                id="option0.5"
                name="allyThreshold"
                value="0.5"
                checked={allyThreshold === 0.5 && includeAllies == true}
                onChange={(e) => {
                  handleRadioChange(e);
                  setIncludeAllies(true);
                }}
              />
              <label htmlFor="option0.5" className="ml-1">
                Partial Allies
              </label>
            </div>

            <div className="ml-2">
              <input
                type="radio"
                id="option1"
                name="allyThreshold"
                value="1"
                checked={allyThreshold === 1 && includeAllies == true}
                onChange={(e) => {
                  handleRadioChange(e);
                  setIncludeAllies(true);
                }}
              />
              <label htmlFor="option1" className="ml-1">
                Full Allies
              </label>
            </div>
          </div>
        </div>
      ) : null}
      <div data-pagemode={pageMode} className="w-full h-full">
        <table data-hidedemographics={hideStats} className="w-full table-auto">
          <thead className="text-center text-xs md:text-sm lg:text-base">
            <tr>
              <th className="px-2 py-1 min-w-[120px]">Countries</th>
              <th className="px-2 py-1 min-w-[80px]">GDP</th>
              <th className="px-2 py-1 min-w-[80px]">GDP PPP</th>
              <th className="px-2 py-1 min-w-[80px]">Population</th>
              <th className="px-2 py-1 min-w-[80px]">Area (km²)</th>
            </tr>
          </thead>
          <tbody className="text-right text-xs md:text-sm lg:text-base">
            <tr>
              <td className="px-2 py-2 text-blue-700 text-left">
                {displayStats && phase2Countries.length > 0 ? (
                  pageMode == "single" ? (
                    <div className="overflow-auto">{phase2Countries.join(", ")}</div>
                  ) : (
                    <div className="overflow-auto font-medium">
                      <span className="text-blue-800 font-bold">Blue Side</span>{" "}
                      {includeAllies && (
                        <span>
                          and{" "}
                          <span title={phase2AlliesTooltip}>
                            {phase2AlliesArray.length} {phase2AlliesArray.length == 1 ? "Ally" : "Allies"}
                          </span>
                        </span>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">
                    {pageMode == "single" ? "Select country..." : "Blue Side"}
                  </div>
                )}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase2Data.GDP > 0 ? formatMoney(phase2Data.GDP) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">$0.00 trillion</span>}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase2Data.GDP_PPP > 0 ? formatMoney(phase2Data.GDP_PPP) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">$0.00 trillion</span>}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase2Data.Population > 0 ? formatPopulation(phase2Data.Population) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">0 million</span>}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase2Data.Area > 0 ? formatArea(phase2Data.Area) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">0 km²</span>}
              </td>
            </tr>
            <tr data-pagemode={pageMode} className="data-[pagemode=single]:hidden">
              <td className="px-2 py-2 text-red-700 text-left">
                {displayStats && phase3Countries.length > 0 ? (
                  <div className="overflow-auto font-medium">
                    <span className="text-red-800 font-bold">Red Side</span>{" "}
                    {includeAllies && (
                      <span>
                        and{" "}
                        <span title={phase3AlliesTooltip}>
                          {phase3AlliesArray.length} {phase3AlliesArray.length == 1 ? "Ally" : "Allies"}
                        </span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">Red Side</div>
                )}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase3Data.GDP > 0 ? formatMoney(phase3Data.GDP) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">$0.00 trillion</span>}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase3Data.GDP_PPP > 0 ? formatMoney(phase3Data.GDP_PPP) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">$0.00 trillion</span>}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase3Data.Population > 0 ? formatPopulation(phase3Data.Population) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">0 million</span>}
              </td>
              <td className="px-2 py-2">
                {displayStats && phase3Data.Area > 0 ? formatArea(phase3Data.Area) : <span className="text-gray-400 opacity-30 text-xs md:text-sm lg:text-base">0 km²</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  );
}

export default TabDemographic;
