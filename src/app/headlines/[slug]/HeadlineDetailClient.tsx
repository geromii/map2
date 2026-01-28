"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, usePreloadedQuery, Preloaded } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { CountryDetailModal } from "@/components/custom/CountryDetailModal";
import { CountryListView } from "@/components/custom/CountryListView";
import { ArrowLeft, Map, List, ChevronRight, X } from "lucide-react";
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
  preloadedHeadline?: Preloaded<typeof api.headlines.getHeadlineBySlug>;
}

export function HeadlineDetailClient({ slug, preloadedHeadline }: HeadlineDetailClientProps) {
  // Use preloaded data if available (instant), otherwise fetch client-side
  const preloadedData = preloadedHeadline ? usePreloadedQuery(preloadedHeadline) : undefined;
  const queryData = useQuery(
    api.headlines.getHeadlineBySlug,
    preloadedHeadline ? "skip" : { slug }
  );
  const headline = preloadedData ?? queryData;

  // Detail view mode (map or list) - used for desktop only
  const [detailView, setDetailView] = useState<"map" | "list">("map");

  // Mobile: show headline detail modal
  const [showHeadlineModal, setShowHeadlineModal] = useState(false);

  // Hover state (for map)
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Selected country for modal
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);

  // Use embedded mapScores if available (bandwidth optimized - 1 doc read)
  // Includes reasoning preview for hover tooltips
  const hasEmbeddedScores = headline?.mapScores && headline.mapScores.length > 0;
  const mapScoresQuery = useQuery(
    api.headlines.getHeadlineScoresForMap,
    headline?._id && !hasEmbeddedScores ? { headlineId: headline._id } : "skip"
  );

  // Fetch full scores with reasoning only when user clicks for detail
  // (reasoning preview is embedded in mapScores for hover)
  const fullScoresQuery = useQuery(
    api.headlines.getHeadlineScores,
    headline?._id && !hasEmbeddedScores ? { headlineId: headline._id } : "skip"
  );

  // Fetch image URL
  const headlineImageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline?._id ? { headlineId: headline._id } : "skip"
  );

  // Use embedded scoreCounts if available (bandwidth optimized)
  const countsQuery = useQuery(
    api.headlines.getHeadlineCounts,
    headline?._id && !headline?.scoreCounts ? { headlineId: headline._id } : "skip"
  );
  const counts = headline?.scoreCounts
    ? { sideA: headline.scoreCounts.a, sideB: headline.scoreCounts.b, neutral: headline.scoreCounts.n }
    : countsQuery;

  // Compute scores - prefer embedded mapScores (includes reasoning preview), then query
  const scores = useMemo(() => {
    const result: Record<string, { score: number; reasoning?: string }> = {};

    // First, populate from embedded mapScores if available (includes reasoning preview)
    if (hasEmbeddedScores && headline?.mapScores) {
      for (const s of headline.mapScores) {
        result[s.c] = { score: s.s, reasoning: s.r };
      }
    } else if (mapScoresQuery) {
      // Fall back to query result (also includes reasoning now)
      for (const s of mapScoresQuery) {
        result[s.countryName] = { score: s.score, reasoning: s.reasoning };
      }
    }

    // Merge full reasoning from full scores query (only for unmigrated data)
    if (fullScoresQuery && !hasEmbeddedScores) {
      for (const s of fullScoresQuery) {
        if (result[s.countryName]) {
          result[s.countryName].reasoning = s.reasoning;
        } else {
          result[s.countryName] = { score: s.score, reasoning: s.reasoning };
        }
      }
    }

    return result;
  }, [hasEmbeddedScores, headline?.mapScores, mapScoresQuery, fullScoresQuery]);

  const hasMapScores = hasEmbeddedScores || (mapScoresQuery && mapScoresQuery.length > 0);

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

  // Reusable toggle component
  const ViewToggle = () => (
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
  );

  return (
    <>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="lg:hidden h-[calc(100vh-48px)] flex flex-col bg-slate-50">
        {/* 1. Header: Clickable to open detail modal */}
        <button
          onClick={() => setShowHeadlineModal(true)}
          className="flex-shrink-0 flex gap-3 bg-white border-b border-slate-200 p-3 w-full text-left hover:bg-slate-50 transition-colors"
        >
          {/* Left: Title, description, date */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2 italic">
              {headline.title}
            </h1>
            {headline.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {headline.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400">
                {new Date(headline.generatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Right: Image */}
          <div className="w-28 h-20 flex-shrink-0 relative bg-slate-200 rounded-lg overflow-hidden shadow-sm">
            {headlineImageUrl && (
              <Image
                src={headlineImageUrl}
                alt={headline.title}
                fill
                className="object-cover"
                sizes="30vw"
                priority
              />
            )}
          </div>
        </button>

        {/* 2. Map section (always visible) */}
        <div className="flex-shrink-0 relative aspect-[17/10] bg-slate-100">
          <D3ScoreMap
            scores={scores}
            onCountryHover={handleCountryHover}
            onCountryClick={handleCountryClick}
            className="w-full h-full"
          />

          {/* Tooltip */}
          {hoveredCountry && (
            <div className="absolute top-2 right-2 pointer-events-none">
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
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend bar below map */}
        {hasResults && (
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex justify-center">
            <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} sideACount={counts?.sideA} sideBCount={counts?.sideB} />
          </div>
        )}

        {/* 3. List section (always visible, self-contained scroll) */}
        <div className="flex-1 min-h-0 bg-white overflow-hidden">
          {hasResults ? (
            <CountryListView
              scores={scores}
              sideALabel={sideALabel}
              sideBLabel={sideBLabel}
              onCountryClick={(country, score) =>
                setSelectedCountry({ name: country, ...score })
              }
            />
          ) : (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <div className="text-center px-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading country list...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden lg:flex h-[calc(100vh-48px)] bg-slate-50 flex-col">
        {/* Top bar with back button and view toggle */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <Link
            href="/headlines"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Headlines</span>
          </Link>
          <ViewToggle />
        </div>

        {/* Main content - two column */}
        <div className="flex-1 overflow-hidden flex flex-row">
          {/* Left column: Image + Text */}
          <div className="w-[400px] xl:w-[480px] flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
            {/* Headline image */}
            <div className="relative w-full aspect-video bg-slate-200">
              {headlineImageUrl && (
                <Image
                  src={headlineImageUrl}
                  alt={headline.title}
                  fill
                  className="object-cover"
                  sizes="480px"
                  priority
                />
              )}
            </div>

            {/* Headline info */}
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900 italic">
                {headline.title}
              </h1>
              {headline.description && (
                <p className="text-base text-slate-600 mt-2">
                  {headline.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <span className="text-slate-500">
                  {new Date(headline.generatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-blue-700 font-medium">
                    {counts && <span className="mr-1">{counts.sideA}</span>}
                    {headline.sideA.label}
                  </span>
                </span>
                <span className="text-slate-400">vs</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-700 font-medium">
                    {counts && <span className="mr-1">{counts.sideB}</span>}
                    {headline.sideB.label}
                  </span>
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
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} sideACount={counts?.sideA} sideBCount={counts?.sideB} />
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
      </div>

      {/* Country detail modal (shared) */}
      {selectedCountry && (
        <CountryDetailModal
          country={selectedCountry.name}
          score={selectedCountry.score}
          reasoning={selectedCountry.reasoning}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          onClose={() => setSelectedCountry(null)}
          headlineId={headline._id}
        />
      )}

      {/* Headline detail modal (mobile) */}
      {showHeadlineModal && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowHeadlineModal(false)}
          />
          {/* Modal */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header image */}
            <div className="relative aspect-video bg-slate-200 flex-shrink-0">
              {headlineImageUrl && (
                <Image
                  src={headlineImageUrl}
                  alt={headline.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              )}
              <button
                onClick={() => setShowHeadlineModal(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-xl font-bold text-slate-900 italic">
                {headline.title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {new Date(headline.generatedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
              {headline.description && (
                <p className="text-base text-slate-600 mt-4 leading-relaxed">
                  {headline.description}
                </p>
              )}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
