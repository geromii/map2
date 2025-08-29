import React from "react";
import { getCountryEmoji } from "../../utils/countryEmojis";

export default function CountryNameDisplay({ phase2Countries, phase3Countries, pageMode }) {
  const hasCountries = phase2Countries.length > 0 || phase3Countries.length > 0;
  
  if (!hasCountries) return null;

  return (
    <div className="flex justify-center items-center py-3 px-4 bg-background/50">
      <div className="flex gap-6 items-center">
        {phase2Countries.length > 0 && (
          <div className={`flex items-center gap-2 ${pageMode === "single" ? "text-black dark:text-white" : "text-blue-700 dark:text-blue-400"}`}>
            {phase2Countries.map((country, index) => (
              <div key={index} className="flex items-center">
                <span className="text-2xl lg:text-3xl">{getCountryEmoji(country)}</span>
                <span className="ml-2 text-2xl lg:text-3xl font-serif font-semibold">{country}</span>
              </div>
            ))}
          </div>
        )}
        
        {pageMode !== "single" && phase2Countries.length > 0 && phase3Countries.length > 0 && (
          <span className="text-gray-500 text-xl">vs</span>
        )}
        
        {phase3Countries.length > 0 && pageMode !== "single" && (
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            {phase3Countries.map((country, index) => (
              <div key={index} className="flex items-center">
                <span className="text-2xl lg:text-3xl">{getCountryEmoji(country)}</span>
                <span className="ml-2 text-2xl lg:text-3xl font-serif font-semibold">{country}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}