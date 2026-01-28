"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, usePreloadedQuery, Preloaded } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { CountryDetailModal } from "@/components/custom/CountryDetailModal";
import { CountryListView } from "@/components/custom/CountryListView";
import { ArrowLeft, Map, List } from "lucide-react";

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

interface ScenarioDetailClientProps {
  slug: string;
  preloadedIssue?: Preloaded<typeof api.issues.getIssueBySlug>;
}

export function ScenarioDetailClient({ slug, preloadedIssue }: ScenarioDetailClientProps) {
  const preloadedData = preloadedIssue ? usePreloadedQuery(preloadedIssue) : undefined;
  const queryData = useQuery(
    api.issues.getIssueBySlug,
    preloadedIssue ? "skip" : { slug }
  );
  const issue = preloadedData ?? queryData;

  const [detailView, setDetailView] = useState<"map" | "list">("map");
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);

  // Use embedded mapScores if available
  const hasEmbeddedScores = issue?.mapScores && issue.mapScores.length > 0;

  // Fallback: query scores table
  const fallbackScores = useQuery(
    api.issues.getIssueScores,
    issue?._id && !hasEmbeddedScores ? { issueId: issue._id } : "skip"
  );

  const scores = useMemo(() => {
    const result: Record<string, { score: number; reasoning?: string }> = {};
    if (hasEmbeddedScores && issue?.mapScores) {
      for (const s of issue.mapScores) {
        result[s.c] = { score: s.s, reasoning: s.r };
      }
    } else if (fallbackScores) {
      for (const s of fallbackScores) {
        result[s.countryName] = { score: s.score, reasoning: s.reasoning };
      }
    }
    return result;
  }, [hasEmbeddedScores, issue?.mapScores, fallbackScores]);

  const scoreCounts = useMemo(() => {
    if (issue?.scoreCounts) {
      return { sideA: issue.scoreCounts.a, sideB: issue.scoreCounts.b, neutral: issue.scoreCounts.n };
    }
    let sideA = 0, sideB = 0, neutral = 0;
    for (const { score } of Object.values(scores)) {
      if (score > 0.305) sideA++;
      else if (score < -0.305) sideB++;
      else neutral++;
    }
    return { sideA, sideB, neutral };
  }, [issue?.scoreCounts, scores]);

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
        setSelectedCountry({ name: country, score: score.score, reasoning: score.reasoning });
      }
    },
    []
  );

  if (issue === undefined) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (issue === null) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Scenario not found</h1>
          <p className="text-slate-600 mb-4">This scenario doesn&apos;t exist or has been removed.</p>
          <Link
            href="/scenario"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scenario Generator
          </Link>
        </div>
      </div>
    );
  }

  const hasResults = Object.keys(scores).length > 0;
  const sideALabel = issue.sideA.label || "Supports";
  const sideBLabel = issue.sideB.label || "Opposes";

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
      {/* Mobile layout */}
      <div className="lg:hidden h-[calc(100vh-48px)] flex flex-col bg-slate-50">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 p-3">
          <Link
            href="/scenario"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Scenarios
          </Link>
          <h1 className="text-lg font-bold text-slate-900 leading-snug">
            {issue.title}
          </h1>
          {issue.description && (
            <p className="text-sm text-slate-500 mt-1">{issue.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-blue-700 font-medium">
                {scoreCounts.sideA} {sideALabel}
              </span>
            </span>
            <span className="text-slate-400">vs</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-700 font-medium">
                {scoreCounts.sideB} {sideBLabel}
              </span>
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="flex-shrink-0 relative aspect-[17/10] bg-slate-100">
          <D3ScoreMap
            scores={scores}
            onCountryHover={handleCountryHover}
            onCountryClick={handleCountryClick}
            className="w-full h-full"
          />
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
          {!hasResults && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          )}
        </div>

        {hasResults && (
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex justify-center">
            <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} sideACount={scoreCounts.sideA} sideBCount={scoreCounts.sideB} />
          </div>
        )}

        {/* Country list */}
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

      {/* Desktop layout */}
      <div className="hidden lg:flex h-[calc(100vh-48px)] bg-slate-50 flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <Link
            href="/scenario"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Scenarios</span>
          </Link>
          <ViewToggle />
        </div>

        <div className="flex-1 overflow-hidden flex flex-row">
          {/* Left column: Info */}
          <div className="w-[400px] xl:w-[480px] flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900">
                {issue.title}
              </h1>
              {issue.description && (
                <p className="text-base text-slate-600 mt-2">{issue.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <span className="text-slate-500">
                  {new Date(issue.generatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {issue.primaryActor && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">by {issue.primaryActor}</span>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-blue-700 font-medium">
                    {scoreCounts.sideA} {sideALabel}
                  </span>
                </span>
                <span className="text-slate-400">vs</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-700 font-medium">
                    {scoreCounts.sideB} {sideBLabel}
                  </span>
                </span>
              </div>

              {/* Side descriptions */}
              <div className="mt-6 space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-blue-800">{issue.sideA.label}</span>
                  </div>
                  <p className="text-sm text-blue-700">{issue.sideA.description}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-800">{issue.sideB.label}</span>
                  </div>
                  <p className="text-sm text-red-700">{issue.sideB.description}</p>
                </div>
              </div>

              {hasResults && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <ScoreLegend sideALabel={sideALabel} sideBLabel={sideBLabel} sideACount={scoreCounts.sideA} sideBCount={scoreCounts.sideB} />
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

      {/* Country detail modal */}
      {selectedCountry && (
        <CountryDetailModal
          country={selectedCountry.name}
          score={selectedCountry.score}
          reasoning={selectedCountry.reasoning}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          onClose={() => setSelectedCountry(null)}
          issueId={issue._id}
        />
      )}
    </>
  );
}
