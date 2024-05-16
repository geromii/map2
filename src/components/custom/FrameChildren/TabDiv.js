"use client";

import React, { useState, useEffect } from "react";
import useCountryStore from "../../../app/useCountryStore";
import TabDemographic from "../tabDemographic";
import TabStats from "../../../app/tabStats";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import {
  IconInfoCircle,
  IconArrowBigDownLines,
} from "@tabler/icons-react";
import useEuCountries from "src/utils/eu";

export default function TabDiv({
  pageMode = "single",
  tabVisible,
}) {
  const [sortedCountries, setSortedCountries] = useState([]);
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
        .filter(([_, value]) => value.probability != 0)
        .sort((a, b) => a[1].probability - b[1].probability)
        .map((entry) => ({
          country: entry[0],
          probability: entry[1].probability,
        }));
      const top3 = sorted.slice(0, 4);
      const bottom3 = sorted.slice(-4).reverse();

      setSortedCountries([...top3, ...bottom3]);
    }

    // Update displayStats based on the updated phase2 and phase3 countries
    setDisplayStats(updateStats);
  }, [countries, pageMode, euCountries]);

  const phase2exists = phase2Countries.length > 0;
  const phase3exists = phase3Countries.length > 0;

  return (
    <Tabs
      data-tabvisible={tabVisible}
      defaultValue="data"
      className="relative flex flex-col items-center justify-between h-[160px] lg:h-[13.02vw]  w-full md:w-[90%] shadow-sm z-20 rounded-none md:rounded-2xl mb-[-2px] lg:mb-[-12px] md:mt-[20px] bg-card/95 border-2 overflow-hidden  ring-primary data-[tabvisible=false]:h-24 data-[tabvisible=false]:mb-2 transition-all duration-500"
    >
      <div
        data-tabvisible={tabVisible}
        data-display={displayStats}
        data-pagemode={pageMode}
        className="absolute top-[60%] data-[tabvisible=false]:top-[20%] data-[display=true]:opacity-0  data-[display=true]:translate-y-10 transition-all duration-500 data-[pagemode=single]:duration-500 data-[pagemode=multi]:duration-500 w-[95%] lg:w-[70%] text-xs sm:text-sm lg:text-base z-30"
      >
        <NoCountrySelected
          pageMode={pageMode}
          phase2Exists={phase2exists}
          phase3Exists={phase3exists}
        />
      </div>
      {tabVisible ? (
        <>
          <TabsList className=" mt-2 justify-center w-[95%] md:w-[70%] grid grid-cols-2 shadow-inner mb-0 z-10">
            <TabsTrigger value="data">For/Against</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent
            value="demographics"
            className="flex justify-center w-full h-[160px] lg:h-[13.02vw]"
          >
            <div className="w-full">
              <TabDemographic
                phase2Countries={phase2Countries}
                phase3Countries={phase3Countries}
                pageMode={pageMode}
                displayStats={displayStats}
              />
            </div>
          </TabsContent>
          <TabsContent
            value="data"
            className="flex justify-center w-full h-[130px] lg:h-[10.02vw]"
          >
            <TabStats
              pageMode={pageMode}
              sortedCountries={sortedCountries}
              phase2Countries={phase2Countries}
              phase3Countries={phase3Countries}
              phase2exists={phase2exists}
              phase3exists={phase3exists}
              displayStats={displayStats}
            />
          </TabsContent>
        </>
      ) : null}
    </Tabs>
  );
}

const NoCountrySelected = ({
  pageMode = "single",
  phase2Exists = false,
  phase3Exists = false,
}) => {
  return pageMode === "single" ? (
    <div className="flex justify-around align-top w-full translate-y-3 items-center drop-shadow">
      <div className="flex p-1 lg:p-2 border-2 border-yellow-400 bg-yellow-300 rounded-full shadow-lg font-medium items-center ">
        <IconInfoCircle size={22} className="text-primary drop-shadow" />
        {"  "}
        Select a country below...
      </div>
    </div>
  ) : (
    <div className="flex justify-center translate-y-2 w-full ">
      <div
        data-phase2exists={phase2Exists}
        className="flex p-1 lg:p-2 border-[3px] border-blue-500 bg-blue-100 rounded-full shadow-lg font-medium items-center  data-[phase2exists=true]:opacity-0 data-[phase2exists=true]:translate-y-8 transition-all delay-100 duration-500 mr-1 text-center"
      >
        <IconInfoCircle className="text-primary drop-shadow" /> Select a blue
        country...
      </div>
      <IconArrowBigDownLines
        size={30}
        className="text-primary drop-shadow self-center mx-1 md:mx-1"
      />
      <div
        data-phase3exists={phase3Exists}
        className="flex p-1 lg:p-2 border-[3px] border-red-500 bg-red-100 rounded-full shadow-lg font-medium items-center data-[phase3exists=true]:opacity-0 data-[phase3exists=true]:translate-y-8 transition-all delay-100 duration-500 ml-1 text-center"
      >
        <IconInfoCircle className="text-primary drop-shadow" /> Select a red
        country...
      </div>
    </div>
  );
};
