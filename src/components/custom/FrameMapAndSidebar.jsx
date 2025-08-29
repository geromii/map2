// frame for map
import CountryNameDisplay from "./CountryNameDisplay";
import NoCountrySelected from "./NoCountrySelected";
import { useState, useEffect } from "react";
import useCountryStore from "../../app/useCountryStore";
import useEuCountries from "../../utils/eu";

export default function MapFrame({
  LeftSidebar,
  RightSidebar,
  TabDiv,
  MapDiv,
  pageMode,
}) {
  const euCountries = useEuCountries();
  const countries = useCountryStore((state) => state.countries);
  const [phase2Countries, setPhase2Countries] = useState([]);
  const [phase3Countries, setPhase3Countries] = useState([]);

  useEffect(() => {
    const phase2 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 2)
      .map(([key, _]) => key);
    const phase3 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 3)
      .map(([key, _]) => key);

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

    setPhase2Countries(replaceEuIfAllPresent(phase2));
    setPhase3Countries(replaceEuIfAllPresent(phase3));
  }, [countries, euCountries]);
  return (
    <div className="w-full max-w-full overflow-x-hidden flex flex-row">
      {/* Left Ad Space - Desktop Only */}
      <div className="hidden lg:block w-[160px] pt-10 dark:bg-gray-800   dark:border-gray-600">
        <div className="text-center text-gray-500 dark:text-gray-400">
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Info/Tab Area - Full Width */}
        <TabDiv pageMode={pageMode}/>
        
        {/* Map Content */}
        <div className="map relative w-full">
          {/* NoCountrySelected Indicator - positioned over map */}
          <div 
            data-display={((phase2Countries.length > 0 || phase3Countries.length > 0) && (pageMode === "single" ? phase2Countries.length > 0 || phase3Countries.length > 0 : phase2Countries.length > 0 && phase3Countries.length > 0))}
            data-pagemode={pageMode}
            className="absolute top-0 -translate-y-2 left-1/2 transform -translate-x-1/2 data-[display=true]:opacity-0 data-[display=true]:translate-y-4 transition-all duration-500 data-[pagemode=single]:duration-500 data-[pagemode=multi]:duration-500 z-30 text-xs sm:text-sm lg:text-base"
          >
            <NoCountrySelected
              pageMode={pageMode}
              phase2Exists={phase2Countries.length > 0}
              phase3Exists={phase3Countries.length > 0}
            />
          </div>
          
          <div className="flex flex-col items-center bg-transparent md:scale-[1.00] w-full">
            <MapDiv mapMode={pageMode} />
          </div>
        </div>

        {/* Country Name Display - Below Map */}
        {/* <CountryNameDisplay 
          phase2Countries={phase2Countries} 
          phase3Countries={phase3Countries} 
          pageMode={pageMode} 
        /> */}

        {/* Sidebar Content - Below Map */}
        <div className="flex h-[300px] divide-x-2 mt-4">
          <div className="pl-1 w-1/2">
            <LeftSidebar />
          </div>
          <div className="pl-1 w-1/2">
            {RightSidebar && <RightSidebar />}
          </div>
        </div>
      </div>

      {/* Right Ad Space - Desktop Only */}
      <div className="hidden lg:block w-[160px] pt-10 dark:bg-gray-800 dark:border-gray-600">
        <div className="text-center text-gray-500 dark:text-gray-400">
        </div>
      </div>
    </div>
  );
}
