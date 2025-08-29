"use client";

import React, { useState, useEffect } from "react";
import useCountryStore from "../../../app/useCountryStore";
import TabDemographic from "../tabDemographic";
import TabStats from "../tabStats";
import {
  IconInfoCircle,
  IconArrowBigDownLines,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import useEuCountries from "src/utils/eu";

export default function TabDiv({
  pageMode = "single",
}) {
  const [sortedCountries, setSortedCountries] = useState([]);
  const [phase2Countries, setPhase2Countries] = useState([]);
  const [phase3Countries, setPhase3Countries] = useState([]);
  const [displayStats, setDisplayStats] = useState(false);
  const [forAgainstExpanded, setForAgainstExpanded] = useState(false);
  const [demographicsExpanded, setDemographicsExpanded] = useState(false);
  const euCountries = useEuCountries();
  const countries = useCountryStore((state) => state.countries);

  useEffect(() => {
    // Logic to update phase 2 and phase 3 countries
    const phase2 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 2)
      .map(([key, _]) => key);
    const phase3 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 3)
      .map(([key, _]) => key);

    // if all 27 EU countries from euCountries are the phase, replace the 27 countries with "European Union"
    // Replace EU countries with "European Union" if all 27 are present in the given list
    const replaceEuIfAllPresent = (phase) => {
      const allEuCountriesPresent = euCountries.every((country) =>
        phase.includes(country)
      );
      return allEuCountriesPresent
        ? ["European Union"].concat(
            phase.filter((country) => !euCountries.includes(country))
          )
        : phase;
    };

    // Apply the logic to both phase2 and phase3 directly
    const phase2ToDisplay = replaceEuIfAllPresent(phase2);
    const phase3ToDisplay = replaceEuIfAllPresent(phase3);

    // Set the phase countries
    setPhase2Countries(phase2ToDisplay);
    setPhase3Countries(phase3ToDisplay);

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
        .filter(([_, value]) => value.preferenceScore != 0)
        .sort((a, b) => a[1].preferenceScore - b[1].preferenceScore)
        .map((entry) => ({
          country: entry[0],
          preferenceScore: entry[1].preferenceScore,
        }));
      const top3 = sorted.slice(0, 5);
      const bottom3 = sorted.slice(-5).reverse();

      setSortedCountries([...top3, ...bottom3]);
    }

    // Update displayStats based on the updated phase2 and phase3 countries
    setDisplayStats(updateStats);
  }, [countries, pageMode, euCountries]);

  const phase2exists = phase2Countries.length > 0;
  const phase3exists = phase3Countries.length > 0;

  return (
    <div className="relative flex flex-col items-center w-full z-20 bg-gradient-to-b from-background to-background/80">

      <div className="w-full">
        <div className="bg-white dark:bg-gray-900">
          {/* Demographics Accordion */}
          <div>
          <button
            onClick={() => setDemographicsExpanded(!demographicsExpanded)}
            className="w-full pl-5 pr-2 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-base font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 group"
          >
            <span>Demographics</span>
            <div className="ml-2 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {demographicsExpanded ? <IconChevronUp size={18} className="text-gray-500 dark:text-gray-400" /> : <IconChevronDown size={18} className="text-gray-500 dark:text-gray-400" />}
            </div>
          </button>
          {demographicsExpanded && (
            <div className="p-4">
              <TabDemographic
                phase2Countries={phase2Countries}
                phase3Countries={phase3Countries}
                pageMode={pageMode}
                displayStats={displayStats}
              />
            </div>
          )}
        </div>

          {/* For/Against Accordion */}
          <div>
            <button
              onClick={() => setForAgainstExpanded(!forAgainstExpanded)}
              className="w-full pl-5 pr-2 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-base font-medium text-gray-900 dark:text-gray-100 transition-all duration-200 group"
            >
              <span>For/Against</span>
              <div className="ml-2 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {forAgainstExpanded ? <IconChevronUp size={18} className="text-gray-500 dark:text-gray-400" /> : <IconChevronDown size={18} className="text-gray-500 dark:text-gray-400" />}
              </div>
            </button>
            {forAgainstExpanded && (
              <div className="p-0.5 sm:p-1 lgp-2">
                <TabStats
                  pageMode={pageMode}
                  sortedCountries={sortedCountries}
                  phase2Countries={phase2Countries}
                  phase3Countries={phase3Countries}
                  phase2exists={phase2exists}
                  phase3exists={phase3exists}
                  displayStats={displayStats}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

