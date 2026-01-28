"use client";

import React, { useState } from "react";
import useCountryStore from "@/app/useCountryStore";
import summaries from "@/data/country-summaries/summaries.json";
import { IconX } from "@tabler/icons-react";

interface CountrySummary {
  country: string;
  summary: string;
  keyInterests: string[];
  alignments: string;
  generatedAt: string;
}

const summariesData = summaries as Record<string, CountrySummary>;

interface CountrySummaryPanelProps {
  countryName?: string | null;
}

export function CountrySummaryPanel({ countryName: propCountryName }: CountrySummaryPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const countries = useCountryStore((state) => state.countries);

  // Get the selected country from store if not provided via props
  const selectedCountry = propCountryName ?? Object.entries(countries)
    .filter(([_, value]) => value.phase === 2)
    .map(([key]) => key)[0];

  if (!selectedCountry) {
    return null;
  }

  const summary = summariesData[selectedCountry];

  if (!summary) {
    return null;
  }

  return (
    <>
      <div className="w-full h-full flex items-center">
        <div className="max-w-4xl mx-auto px-6 py-6 sm:px-10 sm:py-8 flex items-start gap-6 w-full">
          {/* Alignments - short sentence */}
          <p className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 italic leading-relaxed flex-1 font-serif">
            {summary.alignments}
          </p>

          {/* Read more button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 hover:text-slate-600 dark:hover:text-slate-400 underline underline-offset-4 decoration-1 mt-1"
          >
            Read more
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                {summary.country}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <IconX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Alignments */}
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                {summary.alignments}
              </p>

              {/* Full Summary */}
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
                {summary.summary}
              </p>

              {/* Key Interests */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Key Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.keyInterests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function getCountrySummary(countryName: string): CountrySummary | null {
  return summariesData[countryName] || null;
}
