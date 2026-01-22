"use client";

import { useState, useCallback } from "react";
import { useConvexAuth, useMutation, useAction, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";

type ProcessingStatus = "idle" | "submitting" | "parsing" | "generating" | "completed" | "failed";

interface HoveredCountry {
  name: string;
  score: number;
  reasoning?: string;
}

interface CurrentIssue {
  id: Id<"issues">;
  title: string;
  description: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
}

export default function ScenarioPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Form state
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Current issue being viewed
  const [currentIssue, setCurrentIssue] = useState<CurrentIssue | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; reasoning?: string }>>({});

  // Hover state
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Convex mutations/actions
  const submitPrompt = useMutation(api.issues.submitCustomPrompt);
  const processPrompt = useAction(api.ai.processCustomPrompt);
  const issueScoresQuery = useQuery(
    api.issues.getIssueScores,
    currentIssue ? { issueId: currentIssue.id } : "skip"
  );

  // Load scores when issue changes
  if (issueScoresQuery && currentIssue && Object.keys(scores).length === 0) {
    const newScores: Record<string, { score: number; reasoning?: string }> = {};
    for (const s of issueScoresQuery) {
      newScores[s.countryName] = { score: s.score, reasoning: s.reasoning };
    }
    if (Object.keys(newScores).length > 0) {
      setScores(newScores);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || status === "submitting" || status === "parsing" || status === "generating") return;

    setStatus("submitting");
    setError(null);
    setCurrentIssue(null);
    setScores({});

    try {
      const promptId = await submitPrompt({ prompt: prompt.trim() });
      setStatus("parsing");

      const result = await processPrompt({ promptId });

      if (result.success && result.issueId) {
        // Fetch the created issue details
        setStatus("completed");
        // The issue will be loaded via the query
        // For now, set a placeholder - in production you'd fetch the full issue
        setCurrentIssue({
          id: result.issueId as Id<"issues">,
          title: prompt.trim(),
          description: "",
          sideA: { label: "Supports", description: "" },
          sideB: { label: "Opposes", description: "" },
        });
        setPrompt("");
      } else {
        setStatus("failed");
        setError(result.error || "Failed to process scenario");
      }
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "An error occurred");
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

  const clearScenario = () => {
    setCurrentIssue(null);
    setScores({});
    setStatus("idle");
    setError(null);
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="h-[calc(100vh-48px)] flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-[calc(100vh-48px)] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            AI Scenario Generator
          </h1>
          <p className="text-slate-600 mb-8">
            Create custom geopolitical scenarios and see how countries might align.
            Sign in to generate your own scenarios.
          </p>
          <Link href="/login">
            <Button size="lg" className="px-8">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = status === "submitting" || status === "parsing" || status === "generating";
  const hasResults = currentIssue && Object.keys(scores).length > 0;

  return (
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex flex-col">
        {/* Prompt input section */}
        <div className="bg-white border-b border-slate-200 px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              AI Scenario Generator
            </h1>
            <p className="text-slate-600 mb-4">
              Describe a geopolitical scenario and AI will predict how each country might position themselves.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., US annexation of Greenland, China invades Taiwan, Global carbon tax..."
                disabled={isProcessing}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="px-6 py-3 h-auto"
              >
                {isProcessing ? "Analyzing..." : "Generate"}
              </Button>
            </form>

            {/* Status messages */}
            {isProcessing && (
              <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                {status === "submitting" && "Submitting scenario..."}
                {status === "parsing" && "AI is parsing the scenario into opposing sides..."}
                {status === "generating" && "Generating country positions (this may take a moment)..."}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Issue header (when viewing results) */}
        {hasResults && currentIssue && (
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{currentIssue.title}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-blue-700 font-medium">{currentIssue.sideA.label}</span>
                  </span>
                  <span className="text-slate-400">vs</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-600" />
                    <span className="text-red-700 font-medium">{currentIssue.sideB.label}</span>
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearScenario}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Map section */}
        <div className="flex-1 relative">
          {/* The map */}
          <D3ScoreMap
            scores={scores}
            onCountryHover={handleCountryHover}
            className="w-full h-full min-h-[400px]"
          />

          {/* Legend (floating) */}
          {hasResults && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-3">
              <ScoreLegend
                sideALabel={currentIssue?.sideA.label || "Supports"}
                sideBLabel={currentIssue?.sideB.label || "Opposes"}
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
                sideALabel={currentIssue?.sideA.label || "Supports"}
                sideBLabel={currentIssue?.sideB.label || "Opposes"}
              />
            </div>
          )}

          {/* Empty state */}
          {!hasResults && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500 max-w-md px-4">
                <div className="text-6xl mb-4 opacity-50">🌍</div>
                <p className="text-lg">
                  Enter a geopolitical scenario above to see how countries might align.
                </p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
