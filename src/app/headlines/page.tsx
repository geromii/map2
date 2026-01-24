"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { Id } from "../../../convex/_generated/dataModel";

interface HoveredCountry {
  name: string;
  score: number;
  reasoning?: string;
}

interface Issue {
  _id: Id<"issues">;
  title: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
  generatedAt: number;
}

export default function HeadlinesPage() {
  // Currently selected issue
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; reasoning?: string }>>({});

  // Hover state
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Fetch active daily issues
  const activeIssues = useQuery(api.issues.getActiveIssues);
  const dailyIssues = activeIssues?.filter((issue) => issue.source === "daily") || [];

  // Fetch scores for selected issue
  const issueScoresQuery = useQuery(
    api.issues.getIssueScores,
    selectedIssueId ? { issueId: selectedIssueId } : "skip"
  );

  // Load scores when they arrive
  useEffect(() => {
    if (issueScoresQuery && selectedIssueId) {
      const newScores: Record<string, { score: number; reasoning?: string }> = {};
      for (const s of issueScoresQuery) {
        newScores[s.countryName] = { score: s.score, reasoning: s.reasoning };
      }
      setScores(newScores);
    }
  }, [issueScoresQuery, selectedIssueId]);

  const selectedIssue = dailyIssues.find((i) => i._id === selectedIssueId);

  const handleSelectIssue = (issue: Issue) => {
    if (selectedIssueId === issue._id) {
      // Deselect
      setSelectedIssueId(null);
      setScores({});
    } else {
      setSelectedIssueId(issue._id);
      setScores({}); // Clear scores, will load via query
    }
  };

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

  const hasResults = selectedIssue && Object.keys(scores).length > 0;

  return (
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex">
      {/* Sidebar - Issue list */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Daily Headlines</h1>
          <p className="text-sm text-slate-600 mt-1">
            AI-generated country positions on current events
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!activeIssues && (
            <div className="p-4 text-center text-slate-500">Loading...</div>
          )}

          {activeIssues && dailyIssues.length === 0 && (
            <div className="p-4 text-center text-slate-500">
              No daily headlines available yet.
            </div>
          )}

          <div className="space-y-2">
            {dailyIssues.map((issue) => (
              <button
                key={issue._id}
                onClick={() => handleSelectIssue(issue)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedIssueId === issue._id
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="font-medium text-slate-900 text-sm leading-snug">
                  {issue.title}
                </div>
                {issue.description && (
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {issue.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-blue-600">{issue.sideA.label}</span>
                  <span className="text-slate-400">vs</span>
                  <span className="text-red-600">{issue.sideB.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Map area */}
      <div className="flex-1 flex flex-col">
        {/* Issue header (when viewing results) */}
        {hasResults && selectedIssue && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{selectedIssue.title}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm">
              {selectedIssue.primaryActor && (
                <>
                  <span className="text-slate-600">
                    <span className="text-slate-400">by</span> {selectedIssue.primaryActor}
                  </span>
                  <span className="text-slate-300">|</span>
                </>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-blue-700 font-medium">{selectedIssue.sideA.label}</span>
              </span>
              <span className="text-slate-400">vs</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                <span className="text-red-700 font-medium">{selectedIssue.sideB.label}</span>
              </span>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <D3ScoreMap
            scores={scores}
            onCountryHover={handleCountryHover}
            className="w-full h-full min-h-[500px]"
          />

          {/* Legend (floating) */}
          {hasResults && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-3">
              <ScoreLegend
                sideALabel={selectedIssue?.sideA.label || "Supports"}
                sideBLabel={selectedIssue?.sideB.label || "Opposes"}
              />
            </div>
          )}

          {/* Tooltip (floating) */}
          {hoveredCountry && (
            <div className="absolute top-4 right-4 pointer-events-none">
              <CountryTooltip
                country={hoveredCountry.name}
                score={hoveredCountry.score}
                reasoning={hoveredCountry.reasoning}
                sideALabel={selectedIssue?.sideA.label || "Supports"}
                sideBLabel={selectedIssue?.sideB.label || "Opposes"}
              />
            </div>
          )}

          {/* Empty state */}
          {!selectedIssue && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500 max-w-md px-4">
                <div className="text-6xl mb-4 opacity-50">📰</div>
                <p className="text-lg">
                  Select a headline from the sidebar to see country positions.
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {selectedIssue && !hasResults && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p>Loading country positions...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
