"use client";

import { useState, useCallback, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { RequireAuth } from "@/components/custom/RequireAuth";

type Step = "input" | "confirm" | "generating" | "results";

interface ParsedScenario {
  title: string;
  description: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
}

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
  // Step tracking
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Parsed scenario for confirmation
  const [parsedScenario, setParsedScenario] = useState<ParsedScenario | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [numRuns, setNumRuns] = useState(2); // Default 2 runs

  // Generation state
  const [jobId, setJobId] = useState<Id<"generationJobs"> | null>(null);
  const [currentIssue, setCurrentIssue] = useState<CurrentIssue | null>(null);
  const [scores, setScores] = useState<Record<string, { score: number; reasoning?: string }>>({});

  // Hover state
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Convex actions
  const parsePrompt = useAction(api.ai.parsePromptToSides);
  const generateScores = useAction(api.ai.generateScoresWithProgress);

  // Poll job status when generating
  const jobStatus = useQuery(
    api.issues.getJobById,
    jobId ? { jobId } : "skip"
  );

  // Poll scores when we have an issue
  const issueScoresQuery = useQuery(
    api.issues.getIssueScores,
    currentIssue ? { issueId: currentIssue.id } : "skip"
  );

  // Load scores when generation completes
  useEffect(() => {
    if (issueScoresQuery && currentIssue && step === "results" && Object.keys(scores).length === 0) {
      const newScores: Record<string, { score: number; reasoning?: string }> = {};
      for (const s of issueScoresQuery) {
        newScores[s.countryName] = { score: s.score, reasoning: s.reasoning };
      }
      if (Object.keys(newScores).length > 0) {
        setScores(newScores);
      }
    }
  }, [issueScoresQuery, currentIssue, step, scores]);

  // Check if generation completed
  useEffect(() => {
    if (jobStatus?.status === "completed" && step === "generating" && currentIssue) {
      setStep("results");
    }
  }, [jobStatus, step, currentIssue]);

  // Step 1: Parse the prompt
  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isParsing) return;

    setIsParsing(true);
    setError(null);

    try {
      const result = await parsePrompt({ prompt: prompt.trim() });

      // Check if AI returned an error
      if (result?.error) {
        setError(result.error);
        return;
      }

      // Validate the response has the expected structure
      if (!result?.title || !result?.sideA?.label || !result?.sideB?.label) {
        console.error("Invalid AI response:", result);
        setError("AI returned an invalid response. Please try again.");
        return;
      }

      setParsedScenario(result);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse scenario");
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2: Generate scores after confirmation
  const handleConfirm = async () => {
    if (!parsedScenario) return;

    setStep("generating");
    setError(null);

    try {
      const result = await generateScores({
        title: parsedScenario.title,
        description: parsedScenario.description,
        sideA: parsedScenario.sideA,
        sideB: parsedScenario.sideB,
        numRuns,
      });

      if (result.success && result.issueId && result.jobId) {
        setJobId(result.jobId as Id<"generationJobs">);
        setCurrentIssue({
          id: result.issueId as Id<"issues">,
          title: parsedScenario.title,
          description: parsedScenario.description,
          sideA: parsedScenario.sideA,
          sideB: parsedScenario.sideB,
        });
      } else {
        setError(result.error || "Failed to generate scores");
        setStep("confirm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("confirm");
    }
  };

  // Go back to edit the scenario
  const handleEdit = () => {
    setStep("input");
    setEditingField(null);
  };

  // Clear everything and start over
  const handleClear = () => {
    setStep("input");
    setPrompt("");
    setParsedScenario(null);
    setCurrentIssue(null);
    setScores({});
    setJobId(null);
    setError(null);
    setEditingField(null);
    setNumRuns(2);
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

  const hasResults = step === "results" && Object.keys(scores).length > 0;

  return (
    <RequireAuth
      title="AI Scenario Generator"
      description="Create custom geopolitical scenarios and see how countries might align. Sign in to generate your own scenarios."
    >
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex flex-col">
      {/* Header section */}
      <div className="bg-white border-b border-slate-200 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            AI Scenario Generator
          </h1>
          <p className="text-slate-600 mb-4">
            Describe a geopolitical scenario and AI will predict how each country might position themselves.
          </p>

          {/* Step 1: Input prompt */}
          {step === "input" && (
            <form onSubmit={handleParse} className="flex gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., US annexation of Greenland, China invades Taiwan, Global carbon tax..."
                disabled={isParsing}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Button
                type="submit"
                disabled={isParsing || !prompt.trim()}
                className="px-6 py-3 h-auto"
              >
                {isParsing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Parsing...
                  </span>
                ) : (
                  "Analyze"
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Review and confirm scenario */}
          {step === "confirm" && parsedScenario && (
            <div className="space-y-4">
              {/* Title - click to edit */}
              <div>
                {editingField === "title" ? (
                  <input
                    type="text"
                    value={parsedScenario.title}
                    onChange={(e) => setParsedScenario({ ...parsedScenario, title: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                    autoFocus
                    className="w-full text-xl font-semibold text-slate-900 px-2 py-1 -mx-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField("title")}
                    className="group flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 transition-colors"
                    title="Click to edit"
                  >
                    <h3 className="text-xl font-semibold text-slate-900">{parsedScenario.title}</h3>
                    <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Description - click to edit */}
              <div>
                {editingField === "description" ? (
                  <textarea
                    value={parsedScenario.description}
                    onChange={(e) => setParsedScenario({ ...parsedScenario, description: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={2}
                    className="w-full text-slate-600 text-sm px-2 py-1 -mx-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField("description")}
                    className="group flex items-start gap-2 cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 transition-colors"
                    title="Click to edit"
                  >
                    <p className="text-slate-600 text-sm flex-1">{parsedScenario.description}</p>
                    <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Side A and Side B */}
              <div className="grid grid-cols-2 gap-4">
                {/* Side A */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                    {editingField === "sideA.label" ? (
                      <input
                        type="text"
                        value={parsedScenario.sideA.label}
                        onChange={(e) => setParsedScenario({
                          ...parsedScenario,
                          sideA: { ...parsedScenario.sideA, label: e.target.value }
                        })}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                        autoFocus
                        className="flex-1 font-medium text-blue-900 px-2 py-0.5 rounded border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingField("sideA.label")}
                        className="group flex items-center gap-1.5 cursor-pointer hover:bg-blue-100 rounded px-2 py-0.5 -mx-2 transition-colors"
                        title="Click to edit"
                      >
                        <span className="font-medium text-blue-900">{parsedScenario.sideA.label}</span>
                        <svg className="w-3 h-3 text-blue-400 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {editingField === "sideA.description" ? (
                    <textarea
                      value={parsedScenario.sideA.description}
                      onChange={(e) => setParsedScenario({
                        ...parsedScenario,
                        sideA: { ...parsedScenario.sideA, description: e.target.value }
                      })}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      rows={3}
                      className="w-full text-sm text-blue-700 px-2 py-1 rounded border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingField("sideA.description")}
                      className="group flex items-start gap-1.5 cursor-pointer hover:bg-blue-100 rounded px-2 py-1 -mx-2 transition-colors"
                      title="Click to edit"
                    >
                      <p className="text-sm text-blue-700 leading-relaxed flex-1">{parsedScenario.sideA.description}</p>
                      <svg className="w-3 h-3 text-blue-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Side B */}
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
                    {editingField === "sideB.label" ? (
                      <input
                        type="text"
                        value={parsedScenario.sideB.label}
                        onChange={(e) => setParsedScenario({
                          ...parsedScenario,
                          sideB: { ...parsedScenario.sideB, label: e.target.value }
                        })}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                        autoFocus
                        className="flex-1 font-medium text-red-900 px-2 py-0.5 rounded border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingField("sideB.label")}
                        className="group flex items-center gap-1.5 cursor-pointer hover:bg-red-100 rounded px-2 py-0.5 -mx-2 transition-colors"
                        title="Click to edit"
                      >
                        <span className="font-medium text-red-900">{parsedScenario.sideB.label}</span>
                        <svg className="w-3 h-3 text-red-400 group-hover:text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {editingField === "sideB.description" ? (
                    <textarea
                      value={parsedScenario.sideB.description}
                      onChange={(e) => setParsedScenario({
                        ...parsedScenario,
                        sideB: { ...parsedScenario.sideB, description: e.target.value }
                      })}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      rows={3}
                      className="w-full text-sm text-red-700 px-2 py-1 rounded border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingField("sideB.description")}
                      className="group flex items-start gap-1.5 cursor-pointer hover:bg-red-100 rounded px-2 py-1 -mx-2 transition-colors"
                      title="Click to edit"
                    >
                      <p className="text-sm text-red-700 leading-relaxed flex-1">{parsedScenario.sideB.description}</p>
                      <svg className="w-3 h-3 text-red-400 group-hover:text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleConfirm} className="px-6">
                  Generate Predictions
                </Button>
                <Button variant="ghost" onClick={handleEdit} className="text-slate-500">
                  Start Over
                </Button>
                <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
                  <label htmlFor="numRuns">Accuracy runs:</label>
                  <select
                    id="numRuns"
                    value={numRuns}
                    onChange={(e) => setNumRuns(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 (fastest)</option>
                    <option value={2}>2 (balanced)</option>
                    <option value={3}>3 (most accurate)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generating with progress */}
          {step === "generating" && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {parsedScenario?.title}
                </h3>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Generating country positions...</span>
                  <span>
                    {jobStatus ? (
                      <>
                        {jobStatus.completedBatches || 0} of {jobStatus.totalBatches || "?"} batches complete
                      </>
                    ) : (
                      "Starting..."
                    )}
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus?.progress || 0}%` }}
                  />
                </div>
                <div className="text-right text-sm text-slate-500 mt-1">
                  {jobStatus?.progress || 0}%
                </div>
              </div>

              <p className="text-sm text-slate-500">
                AI is analyzing how each country might position themselves on this issue.
                This typically takes 30-60 seconds.
              </p>
            </div>
          )}

          {/* Results header */}
          {step === "results" && currentIssue && (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-500">Showing results for:</span>
                <h3 className="text-lg font-semibold text-slate-900">{currentIssue.title}</h3>
              </div>
              <Button variant="outline" onClick={handleClear}>
                New Scenario
              </Button>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Issue header with sides (when viewing results) */}
      {hasResults && currentIssue && (
        <div className="relative bg-gradient-to-r from-blue-50 via-white to-red-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              {/* Side A */}
              <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-3 bg-blue-500/10 px-4 py-2 rounded-l-full border border-blue-200/50 border-r-0">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                  <span className="text-blue-700 font-semibold text-sm">{currentIssue.sideA.label}</span>
                </div>
              </div>

              {/* VS divider */}
              <div className="flex-shrink-0 px-4">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                  <span className="text-slate-400 font-bold text-xs">VS</span>
                </div>
              </div>

              {/* Side B */}
              <div className="flex-1 flex justify-start">
                <div className="flex items-center gap-3 bg-red-500/10 px-4 py-2 rounded-r-full border border-red-200/50 border-l-0">
                  <span className="text-red-700 font-semibold text-sm">{currentIssue.sideB.label}</span>
                  <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map section */}
      <div className="flex-1 relative">
        <D3ScoreMap
          scores={scores}
          onCountryHover={handleCountryHover}
          className="w-full h-full min-h-[400px]"
        />

        {/* Legend (floating) */}
        {hasResults && currentIssue && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-3">
            <ScoreLegend
              sideALabel={currentIssue.sideA.label}
              sideBLabel={currentIssue.sideB.label}
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
        {step === "input" && !isParsing && (
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
    </RequireAuth>
  );
}
