"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { CountryDetailModal } from "@/components/custom/CountryDetailModal";
import { CountryListView } from "@/components/custom/CountryListView";
import { Id } from "../../../convex/_generated/dataModel";
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

interface Headline {
  _id: Id<"headlines">;
  title: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
  generatedAt: number;
  imageId?: Id<"_storage">;
}

// Featured headline card - large with prominent image
function FeaturedHeadlineCard({
  headline,
  onSelect,
}: {
  headline: Headline;
  onSelect: (headline: Headline) => void;
}) {
  const imageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline.imageId ? { headlineId: headline._id } : "skip"
  );
  const counts = useQuery(api.headlines.getHeadlineCounts, { headlineId: headline._id });

  return (
    <button
      onClick={() => onSelect(headline)}
      className="w-full text-left rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md flex flex-col border-slate-200 hover:border-slate-300 overflow-hidden"
    >
      {/* Image area - 16:9 aspect ratio */}
      {imageUrl && (
        <div className="relative w-full aspect-video bg-slate-100">
          <Image
            src={imageUrl}
            alt={headline.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h2 className="font-semibold text-slate-900 text-base sm:text-lg leading-snug">
          {headline.title}
        </h2>
        {headline.description && (
          <p className="text-sm sm:text-base text-slate-600 mt-2 line-clamp-3 flex-1">
            {headline.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-sm text-blue-700 font-medium">
              {counts ? counts.sideA : "–"} {headline.sideA.label}
            </span>
          </span>
          <span className="text-slate-400 text-sm">vs</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-red-700 font-medium">
              {counts ? counts.sideB : "–"} {headline.sideB.label}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

// Secondary headline card - compact card for grid layout
function SecondaryHeadlineCard({
  headline,
  onSelect,
}: {
  headline: Headline;
  onSelect: (headline: Headline) => void;
}) {
  const imageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline.imageId ? { headlineId: headline._id } : "skip"
  );
  const counts = useQuery(api.headlines.getHeadlineCounts, { headlineId: headline._id });

  return (
    <button
      onClick={() => onSelect(headline)}
      className="w-full text-left rounded-lg border bg-white shadow-sm transition-all hover:shadow-md flex flex-row border-slate-200 hover:border-slate-300 overflow-hidden h-24"
    >
      {/* Square thumbnail */}
      <div className="relative w-24 h-24 flex-shrink-0 bg-slate-100">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={headline.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        )}
      </div>

      <div className="p-2.5 flex flex-col flex-1 min-w-0 justify-center">
        <h3 className="font-medium text-slate-900 text-sm leading-snug line-clamp-1">
          {headline.title}
        </h3>
        {headline.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {headline.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-blue-600 font-medium truncate">
              {counts ? counts.sideA : "–"} {headline.sideA.label}
            </span>
          </span>
          <span className="text-slate-400">vs</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-600 font-medium truncate">
              {counts ? counts.sideB : "–"} {headline.sideB.label}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

export default function HeadlinesPage() {
  // Selected headline
  const [selectedHeadlineId, setSelectedHeadlineId] = useState<Id<"headlines"> | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; reasoning?: string }>>({});

  // Detail view mode (map or list) - only relevant when a headline is selected
  const [detailView, setDetailView] = useState<"map" | "list">("map");

  // Hover state (for map)
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Selected country for modal
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);

  // Fetch featured and active headlines
  const featuredHeadlines = useQuery(api.headlines.getFeaturedHeadlines);
  const activeHeadlines = useQuery(api.headlines.getActiveHeadlines);

  // Combined for finding selected headline
  const allHeadlines = [...(featuredHeadlines || []), ...(activeHeadlines || [])];

  // Fetch scores for selected headline
  const headlineScoresQuery = useQuery(
    api.headlines.getHeadlineScores,
    selectedHeadlineId ? { headlineId: selectedHeadlineId } : "skip"
  );

  // Fetch image URL for selected headline
  const selectedHeadlineImageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    selectedHeadlineId ? { headlineId: selectedHeadlineId } : "skip"
  );

  // Load scores when they arrive
  useEffect(() => {
    if (headlineScoresQuery && selectedHeadlineId) {
      const newScores: Record<string, { score: number; reasoning?: string }> = {};
      for (const s of headlineScoresQuery) {
        newScores[s.countryName] = { score: s.score, reasoning: s.reasoning };
      }
      setScores(newScores);
    }
  }, [headlineScoresQuery, selectedHeadlineId]);

  const selectedHeadline = allHeadlines.find((h) => h._id === selectedHeadlineId);

  const handleSelectHeadline = useCallback((headline: Headline) => {
    setSelectedHeadlineId(headline._id);
    setScores({}); // Clear scores, will load via query
    setDetailView("map"); // Default to map view
  }, []);

  const handleBack = useCallback(() => {
    setSelectedHeadlineId(null);
    setScores({});
  }, []);

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

  const hasResults = selectedHeadline && Object.keys(scores).length > 0;

  const sideALabel = selectedHeadline?.sideA.label || "Supports";
  const sideBLabel = selectedHeadline?.sideB.label || "Opposes";

  // Loading state
  const isLoading = featuredHeadlines === undefined || activeHeadlines === undefined;
  const hasNoHeadlines = !isLoading && (featuredHeadlines?.length || 0) === 0 && (activeHeadlines?.length || 0) === 0;

  // Show headlines list when no headline is selected
  if (!selectedHeadlineId) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex flex-col overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Today&apos;s Headlines</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              See how countries position themselves on major world events
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="max-w-6xl mx-auto">
            {isLoading && (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            )}

            {hasNoHeadlines && (
              <div className="p-8 text-center text-slate-500">
                No headlines available yet.
              </div>
            )}

            {/* Featured Headlines - Large cards */}
            {featuredHeadlines && featuredHeadlines.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredHeadlines.map((headline) => (
                  <FeaturedHeadlineCard
                    key={headline._id}
                    headline={headline}
                    onSelect={handleSelectHeadline}
                  />
                ))}
              </div>
            )}

            {/* Secondary Headlines - Compact grid */}
            {activeHeadlines && activeHeadlines.length > 0 && (
              <div className={(featuredHeadlines?.length || 0) > 0 ? "mt-6" : ""}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">More Headlines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeHeadlines.map((headline) => (
                    <SecondaryHeadlineCard
                      key={headline._id}
                      headline={headline}
                      onSelect={handleSelectHeadline}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detail view (selected headline)
  return (
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex flex-col">
      {/* Top bar with back button and view toggle */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Headlines</span>
        </button>

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
          {/* Headline image */}
          {selectedHeadlineImageUrl && (
            <div className="relative w-full aspect-video bg-slate-100">
              <Image
                src={selectedHeadlineImageUrl}
                alt={selectedHeadline?.title || "Headline image"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
                priority
              />
            </div>
          )}

          {/* Headline info */}
          {selectedHeadline && (
            <div className="p-4 sm:p-6">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {selectedHeadline.title}
              </h1>
              {selectedHeadline.description && (
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  {selectedHeadline.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-sm">
                {selectedHeadline.primaryActor && (
                  <>
                    <span className="text-slate-600">
                      <span className="text-slate-400">by</span> {selectedHeadline.primaryActor}
                    </span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                  </>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-blue-700 font-medium">{selectedHeadline.sideA.label}</span>
                </span>
                <span className="text-slate-400">vs</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-700 font-medium">{selectedHeadline.sideB.label}</span>
                </span>
              </div>

              {/* Side descriptions */}
              <div className="mt-6 space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-blue-800">{selectedHeadline.sideA.label}</span>
                  </div>
                  <p className="text-sm text-blue-700">{selectedHeadline.sideA.description}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-800">{selectedHeadline.sideB.label}</span>
                  </div>
                  <p className="text-sm text-red-700">{selectedHeadline.sideB.description}</p>
                </div>
              </div>

              {/* Legend - show below text on desktop */}
              {hasResults && (
                <div className="mt-6 pt-4 border-t border-slate-200 hidden lg:block">
                  <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} />
                </div>
              )}
            </div>
          )}
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
              {selectedHeadline && !hasResults && (
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
