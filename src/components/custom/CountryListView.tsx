"use client";

import { useState, useMemo } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";

interface CountryScore {
  score: number;
  reasoning?: string;
}

interface CountryListViewProps {
  scores: Record<string, CountryScore>;
  sideALabel: string;
  sideBLabel: string;
  onCountryClick?: (country: string, score: CountryScore) => void;
}

function getStance(score: number): "sideA" | "neutral" | "sideB" {
  if (score > 0.3) return "sideA";
  if (score < -0.3) return "sideB";
  return "neutral";
}

function StanceBadge({
  stance,
  sideALabel,
  sideBLabel,
}: {
  stance: "sideA" | "neutral" | "sideB";
  sideALabel: string;
  sideBLabel: string;
}) {
  const styles = {
    sideA: "bg-blue-100 text-blue-700",
    neutral: "bg-slate-100 text-slate-600",
    sideB: "bg-red-100 text-red-700",
  };

  const labels = {
    sideA: sideALabel,
    neutral: "Neutral",
    sideB: sideBLabel,
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[stance]}`}
    >
      {labels[stance]}
    </span>
  );
}

export function CountryListView({
  scores,
  sideALabel,
  sideBLabel,
  onCountryClick,
}: CountryListViewProps) {
  const [search, setSearch] = useState("");
  const [flipped, setFlipped] = useState(false);

  // Convert scores to sorted array
  const sortedCountries = useMemo(() => {
    const entries = Object.entries(scores).map(([country, data]) => ({
      country,
      ...data,
      stance: getStance(data.score),
    }));

    // Sort comparator: descending by default, ascending when flipped
    const sortFn = flipped
      ? (a: { score: number }, b: { score: number }) => a.score - b.score
      : (a: { score: number }, b: { score: number }) => b.score - a.score;

    // Group by stance: Side A → Neutral → Side B (or reversed when flipped)
    const sideA = entries.filter((e) => e.stance === "sideA").sort(sortFn);
    const neutral = entries.filter((e) => e.stance === "neutral").sort(sortFn);
    const sideB = entries.filter((e) => e.stance === "sideB").sort(sortFn);

    if (flipped) {
      return [...sideB, ...neutral, ...sideA];
    }
    return [...sideA, ...neutral, ...sideB];
  }, [scores, flipped]);

  // Filter by search
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return sortedCountries;
    const term = search.toLowerCase();
    return sortedCountries.filter((c) =>
      c.country.toLowerCase().includes(term)
    );
  }, [sortedCountries, search]);

  // Get first sentence of reasoning for preview
  const getReasoningPreview = (reasoning?: string) => {
    if (!reasoning) return null;
    const firstSentence = reasoning.split(/[.!?]/)[0];
    return firstSentence ? firstSentence.trim() + "." : null;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full pl-9 pr-9 py-2 sm:py-2.5 text-sm sm:text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Header with count and flip toggle */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-3 sm:px-4 py-2">
          <span className="text-sm text-slate-500">
            {filteredCountries.length} countries
          </span>
          <button
            onClick={() => setFlipped(!flipped)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {flipped ? `${sideALabel} first` : `${sideBLabel} first`}
          </button>
        </div>
      </div>

      {/* Country list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              {search ? "No countries match your search" : "No country data available"}
            </div>
          ) : (
            filteredCountries.map(({ country, score, reasoning, stance }) => {
              const preview = getReasoningPreview(reasoning);
              return (
                <button
                  key={country}
                  onClick={() => onCountryClick?.(country, { score, reasoning })}
                  className="w-full p-3 sm:p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 truncate sm:text-base">
                      {country}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StanceBadge
                        stance={stance}
                        sideALabel={sideALabel}
                        sideBLabel={sideBLabel}
                      />
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Score: {score > 0 ? "+" : ""}
                    {score.toFixed(2)}
                  </div>
                  {preview && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-1">
                      {preview}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
