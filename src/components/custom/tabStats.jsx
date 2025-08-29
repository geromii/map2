import React from "react";
import { getCountryEmoji } from "../../utils/countryEmojis";
import { abbreviateCountry } from "../../utils/abbreviateCountry";

function TabStats({
  pageMode,
  sortedCountries,
  phase2Countries,
  phase3Countries,
  phase2exists,
  phase3exists,
  displayStats,
}) {
  // Always maintain 5 rows for consistent height
  const positiveCountries = displayStats && sortedCountries.length > 0 
    ? sortedCountries.slice(-5) 
    : [];
  const negativeCountries = displayStats && sortedCountries.length > 0 
    ? sortedCountries.slice(0, 5) 
    : [];

  // Create placeholder rows to maintain consistent height
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
          />
        );
      } else {
        rows.push(
          <div key={`${side}-placeholder-${i}`} className="flex items-center gap-2 opacity-30">
            <span className="font-mono text-sm md:text-base tabular-nums text-gray-400">0.00</span>
            <span className="text-lg md:text-xl text-gray-400">🌍</span>
            <span className="text-sm md:text-base truncate max-w-[150px] md:max-w-[200px] text-gray-400">Country</span>
          </div>
        );
      }
    }
    return rows;
  };

  return (
    <div className="flex items-start justify-center w-full min-h-[120px] overflow-hidden pt-2">
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
  );
}

// Reusable component for country rows
function CountryRow({ country, score, align = "left" }) {
  const isPositive = score > 0;
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <span className={`font-mono text-sm md:text-base tabular-nums font-medium ${isPositive ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
        {score.toFixed(2)}
      </span>
      <span className="text-lg md:text-xl">
        {getCountryEmoji(country)}
      </span>
      <span className="text-sm md:text-base truncate max-w-[120px] md:max-w-[160px] font-medium text-gray-800 dark:text-gray-200">
        {abbreviateCountry(country)}
      </span>
    </div>
  );
}

export default TabStats;