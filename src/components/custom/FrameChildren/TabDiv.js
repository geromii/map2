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
  const [fullSortedList, setFullSortedList] = useState([]);
  const [phase2Countries, setPhase2Countries] = useState([]);
  const [phase3Countries, setPhase3Countries] = useState([]);
  const [displayStats, setDisplayStats] = useState(false);
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
        .sort((a, b) => b[1].preferenceScore - a[1].preferenceScore)
        .map((entry) => ({
          country: entry[0],
          preferenceScore: entry[1].preferenceScore,
        }));

      // Store full sorted list for modal
      setFullSortedList(sorted);

      const top3 = sorted.slice(0, 5);
      const bottom3 = sorted.slice(-5).reverse();

      setSortedCountries([...top3, ...bottom3]);
    } else {
      // Clear the lists when there's no data
      setFullSortedList([]);
      setSortedCountries([]);
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
          {/* Stats Section - Always Open */}
          <div className="p-0.5 sm:p-1 lgp-2">
            <TabStats
              pageMode={pageMode}
              sortedCountries={sortedCountries}
              fullSortedList={fullSortedList}
              phase2Countries={phase2Countries}
              phase3Countries={phase3Countries}
              phase2exists={phase2exists}
              phase3exists={phase3exists}
              displayStats={displayStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

