import React from "react";
import { getCountryEmoji } from "../../utils/countryEmojis";

function TabStats({
  pageMode,
  sortedCountries,
  phase2Countries,
  phase3Countries,
  phase2exists,
  phase3exists,
  displayStats,
}) {
  // Always maintain 4 rows for consistent height
  const positiveCountries = displayStats && sortedCountries.length > 0 
    ? sortedCountries.slice(-4) 
    : [];
  const negativeCountries = displayStats && sortedCountries.length > 0 
    ? sortedCountries.slice(0, 4) 
    : [];

  // Create placeholder rows to maintain consistent height
  const createPlaceholderRows = (data, side) => {
    const rows = [];
    for (let i = 0; i < 4; i++) {
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
      <div className="grid grid-cols-2 gap-4 md:gap-8 lg:gap-12 max-w-2xl w-full px-4">
        {/* Positive Scores Column */}
        <div className="space-y-0.5">
          {createPlaceholderRows(positiveCountries, 'pos')}
        </div>

        {/* Negative Scores Column */}
        <div className="space-y-0.5">
          {createPlaceholderRows(negativeCountries, 'neg')}
        </div>
      </div>
    </div>
  );
}

// Reusable component for country rows
function CountryRow({ country, score, align = "left" }) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <span className="font-mono text-sm md:text-base tabular-nums">
        {score.toFixed(2)}
      </span>
      <span className="text-lg md:text-xl">
        {getCountryEmoji(country)}
      </span>
      <span className="text-sm md:text-base truncate max-w-[150px] md:max-w-[200px]">
        {country}
      </span>
    </div>
  );
}

export default TabStats;