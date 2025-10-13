import React, { useState } from "react";
import { getCountryEmoji } from "../../utils/countryEmojis";
import { abbreviateCountry } from "../../utils/abbreviateCountry";
import useCountryStore from "../../app/useCountryStore";
import FullListModal from "./FullListModal";
import { IconList } from "@tabler/icons-react";

function TabStats({
  pageMode,
  sortedCountries,
  fullSortedList,
  phase2Countries,
  phase3Countries,
  phase2exists,
  phase3exists,
  displayStats,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setCountryPhase, resetAllExcept } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase,
    resetAllExcept: state.resetAllExcept,
  }));
  // Always maintain 5 rows for consistent height
  // Since fullSortedList is sorted high to low, top 5 positive are at start, bottom 5 negative are at end
  const positiveCountries = displayStats && sortedCountries.length > 0
    ? sortedCountries.slice(0, 5)
    : [];
  const negativeCountries = displayStats && sortedCountries.length > 0
    ? sortedCountries.slice(-5)
    : [];

  // Create placeholder rows to maintain consistent height
  const handleCountryClick = (country) => {
    if (pageMode === "single") {
      resetAllExcept();
      setCountryPhase(country, "blue");
    }
  };

  const createPlaceholderRows = (data, side) => {
    const rows = [];
    for (let i = 0; i < 5; i++) {
      if (data[i]) {
        rows.push(
          <CountryRow 
            key={`${side}-${i}`}
            country={data[i].country}
            score={data[i].preferenceScore}
            align="left"
            onClick={handleCountryClick}
            pageMode={pageMode}
          />
        );
      } else {
        rows.push(
          <div key={`${side}-placeholder-${i}`} className="flex items-center opacity-30">
            <span className="font-mono text-sm md:text-base tabular-nums text-gray-400">0.00</span>
            <span className="text-lg md:text-xl text-gray-400 ml-1">🌍</span>
            <span className="text-sm md:text-base truncate max-w-[150px] md:max-w-[200px] text-gray-400 ml-0 sm:ml-2">Country</span>
          </div>
        );
      }
    }
    return rows;
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full min-h-[120px] overflow-hidden pt-2">
        {/* See Full List Button - Above boxes */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={fullSortedList.length === 0}
          className="mb-2 flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-r from-blue-50 via-white to-red-50 dark:from-blue-950/20 dark:via-gray-800 dark:to-red-950/20 hover:from-blue-100 hover:via-gray-100 hover:to-red-100 dark:hover:from-blue-950/40 dark:hover:via-gray-700 dark:hover:to-red-950/40 rounded-lg transition-all border border-gray-300 dark:border-gray-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconList className="w-4 h-4" />
          See Full List
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1 sm:gap-4 lg:gap-8 max-w-2xl w-full px-1 sm:px-2 lg:px-4">
          {/* Positive Scores Column */}
          <div className="space-y-0.5 bg-blue-50 dark:bg-blue-950/20 p-1 sm:p-2 lg:p-3 rounded-lg">
            {createPlaceholderRows(positiveCountries, 'pos')}
          </div>

          {/* Negative Scores Column */}
          <div className="space-y-0.5 bg-red-50 dark:bg-red-950/20 p-1 sm:p-2 lg:p-3 rounded-lg">
            {createPlaceholderRows(negativeCountries, 'neg')}
          </div>
        </div>
      </div>

      {/* Modal */}
      <FullListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fullSortedList={fullSortedList}
        pageMode={pageMode}
        phase2Countries={phase2Countries}
        phase3Countries={phase3Countries}
      />
    </>
  );
}

// Reusable component for country rows
function CountryRow({ country, score, align = "left", onClick, pageMode }) {
  const isPositive = score > 0;
  const isClickable = pageMode === "single";
  
  return (
    <div 
      className={`flex items-center ${align === "right" ? "flex-row-reverse" : ""} ${isClickable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 transition-colors" : ""}`}
      onClick={isClickable ? () => onClick(country) : undefined}
    >
      <span className={`font-mono text-sm md:text-base tabular-nums font-medium ${isPositive ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
        {score.toFixed(2)}
      </span>
      <span className="text-lg md:text-xl ml-1">
        {getCountryEmoji(country)}
      </span>
      <span className="text-sm md:text-base truncate max-w-[120px] md:max-w-[160px] font-medium text-gray-800 dark:text-gray-200 ml-0 sm:ml-2">
        {abbreviateCountry(country)}
      </span>
    </div>
  );
}

export default TabStats;