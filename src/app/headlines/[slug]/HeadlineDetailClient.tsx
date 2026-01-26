"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { CountryDetailModal } from "@/components/custom/CountryDetailModal";
import { CountryListView } from "@/components/custom/CountryListView";
import { ArrowLeft, Map, List } from "lucide-react";
import Image from "next/image";

interface HoveredCountry {
  name: string;
  score: number;
  reasoning?: string;
}

interface SelectedCountry {
  name: string;
  score: number;
  reasoning?: string;
}

interface HeadlineDetailClientProps {
  slug: string;
}

export function HeadlineDetailClient({ slug }: HeadlineDetailClientProps) {
  // Fetch headline by slug - should be instant if prefetched on list page
  const headline = useQuery(api.headlines.getHeadlineBySlug, { slug });

  // Detail view mode (map or list)
  const [detailView, setDetailView] = useState<"map" | "list">("map");

  // Hover state (for map)
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Selected country for modal
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);

  // Fetch map scores - should be instant if prefetched on list page
  const mapScoresQuery = useQuery(
    api.headlines.getHeadlineScoresForMap,
    headline?._id ? { headlineId: headline._id } : "skip"
  );

  // Fetch full scores with reasoning
  const fullScoresQuery = useQuery(
    api.headlines.getHeadlineScores,
    headline?._id ? { headlineId: headline._id } : "skip"
  );

  // Fetch image URL
  const headlineImageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline?._id ? { headlineId: headline._id } : "skip"
  );

  // Compute scores directly from queries
  const scores = useMemo(() => {
    const result: Record<string, { score: number; reasoning?: string }> = {};

    if (mapScoresQuery) {
      for (const s of mapScoresQuery) {
        result[s.countryName] = { score: s.score };
      }
    }

    if (fullScoresQuery) {
      for (const s of fullScoresQuery) {
        if (result[s.countryName]) {
          result[s.countryName].reasoning = s.reasoning;
        } else {
          result[s.countryName] = { score: s.score, reasoning: s.reasoning };
        }
      }
    }

    return result;
  }, [mapScoresQuery, fullScoresQuery]);

  const hasMapScores = mapScoresQuery && mapScoresQuery.length > 0;

  const handleCountryHover = useCallback(
    (country: string | null, score: { score: number; reasoning?: string } | null) => {
      if (country && score) {
        setHoveredCountry({ name: country, score: score.score, reasoning: score.reasoning });
      } else {
        setHoveredCountry(null);
      }
    },
    []
  );

  const handleCountryClick = useCallback(
    (country: string, score: { score: number; reasoning?: string } | null) => {
      if (score) {
        setSelectedCountry({
          name: country,
          score: score.score,
          reasoning: score.reasoning,
        });
      }
    },
    []
  );

  // Loading state
  if (headline === undefined) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading headline...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (headline === null) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Headline not found</h1>
          <p className="text-slate-600 mb-4">This headline doesn&apos;t exist or has been removed.</p>
          <Link
            href="/headlines"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Headlines
          </Link>
        </div>
      </div>
    );
  }

  const hasResults = hasMapScores;
  const sideALabel = headline.sideA.label || "Supports";
  const sideBLabel = headline.sideB.label || "Opposes";

  return (
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex flex-col">
      {/* Top bar with back button and view toggle */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link
          href="/headlines"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Headlines</span>
        </Link>

        {/* Map/List toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setDetailView("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              detailView === "map"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setDetailView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              detailView === "list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main content - two column on desktop */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left column: Image + Text (scrollable on mobile, fixed on desktop) */}
        <div className="lg:w-[400px] xl:w-[480px] lg:flex-shrink-0 bg-white lg:border-r border-slate-200 overflow-y-auto">
          {/* Headline image with placeholder */}
          <div className="relative w-full aspect-video bg-slate-200">
            {headlineImageUrl && (
              <Image
                src={headlineImageUrl}
                alt={headline.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
                priority
              />
            )}
          </div>

          {/* Headline info */}
          <div className="p-4 sm:p-6">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {headline.title}
            </h1>
            {headline.description && (
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                {headline.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-sm">
              {headline.primaryActor && (
                <>
                  <span className="text-slate-600">
                    <span className="text-slate-400">by</span> {headline.primaryActor}
                  </span>
                  <span className="text-slate-300 hidden sm:inline">|</span>
                </>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-blue-700 font-medium">{headline.sideA.label}</span>
              </span>
              <span className="text-slate-400">vs</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-red-700 font-medium">{headline.sideB.label}</span>
              </span>
            </div>

            {/* Side descriptions */}
            <div className="mt-6 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-blue-800">{headline.sideA.label}</span>
                </div>
                <p className="text-sm text-blue-700">{headline.sideA.description}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-800">{headline.sideB.label}</span>
                </div>
                <p className="text-sm text-red-700">{headline.sideB.description}</p>
              </div>
            </div>

            {/* Legend - show below text on desktop */}
            {hasResults && (
              <div className="mt-6 pt-4 border-t border-slate-200 hidden lg:block">
                <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} />
              </div>
            )}
          </div>
        </div>

        {/* Right column: Map or List */}
        <main className="flex-1 overflow-hidden">
          {detailView === "map" ? (
            <div className="relative h-full">
              <D3ScoreMap
                scores={scores}
                onCountryHover={handleCountryHover}
                onCountryClick={handleCountryClick}
                className="w-full h-full"
              />

              {/* Legend (floating) - only show on mobile */}
              {hasResults && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-3 lg:hidden">
                  <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} />
                </div>
              )}

              {/* Tooltip (floating) */}
              {hoveredCountry && (
                <div className="absolute top-4 right-4 pointer-events-none">
                  <CountryTooltip
                    country={hoveredCountry.name}
                    score={hoveredCountry.score}
                    reasoning={hoveredCountry.reasoning}
                    sideALabel={sideALabel}
                    sideBLabel={sideBLabel}
                  />
                </div>
              )}

              {/* Loading state */}
              {!hasResults && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p>Loading country positions...</p>
                  </div>
                </div>
              )}
            </div>
          ) : hasResults ? (
            <CountryListView
              scores={scores}
              sideALabel={sideALabel}
              sideBLabel={sideBLabel}
              onCountryClick={(country, score) =>
                setSelectedCountry({ name: country, ...score })
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center px-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p>Loading country positions...</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Country detail modal */}
      {selectedCountry && (
        <CountryDetailModal
          country={selectedCountry.name}
          score={selectedCountry.score}
          reasoning={selectedCountry.reasoning}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}
