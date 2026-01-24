"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { D3ScoreMap, ScoreLegend, CountryTooltip } from "@/components/custom/D3ScoreMap";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { RequireAuth } from "@/components/custom/RequireAuth";

type Step = "input" | "confirm" | "generating" | "results";

interface ParsedScenario {
  title: string;
  description: string;
  primaryActor?: string;
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
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
}

interface SavedScenario {
  _id: Id<"issues">;
  title: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
  generatedAt: number;
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

  // Fun fact state - stores all facts, with index for navigation
  const [funFacts, setFunFacts] = useState<string[]>([]);
  const [factIndex, setFactIndex] = useState(0);
  const [factFading, setFactFading] = useState(false);

  // Hover state
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry | null>(null);

  // Convex queries, mutations, and actions
  const parsePrompt = useAction(api.ai.parsePromptToSides);
  const generateFunFact = useAction(api.ai.generateFunFact);
  const initializeScenario = useMutation(api.issues.initializeScenario);
  const processScenarioBatches = useAction(api.ai.processScenarioBatches);
  const getActiveMapVersion = useQuery(api.issues.getActiveMapVersion);
  const userId = useQuery(api.issues.getCurrentUserId);
  const userScenarios = useQuery(api.issues.getUserScenarios) as SavedScenario[] | undefined;
  const deleteScenario = useMutation(api.issues.deleteScenario);

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

  // Load scores in real-time (during generation and when viewing saved scenarios)
  useEffect(() => {
    if (issueScoresQuery && currentIssue) {
      const newScores: Record<string, { score: number; reasoning?: string }> = {};
      for (const s of issueScoresQuery) {
        newScores[s.countryName] = { score: s.score, reasoning: s.reasoning };
      }
      setScores(newScores);
    }
  }, [issueScoresQuery, currentIssue]);

  // Check if generation completed
  useEffect(() => {
    if (jobStatus?.status === "completed" && step === "generating" && currentIssue) {
      setStep("results");
    }
  }, [jobStatus, step, currentIssue]);

  // Ref to track fun facts without causing re-renders
  const funFactsRef = useRef<string[]>([]);
  funFactsRef.current = funFacts;

  // Max number of fun facts to generate
  const MAX_FUN_FACTS = 3;

  // Cycle fun facts during generation (initial fact is pre-generated on parse)
  // Stops when: generation completes OR we hit 3 facts
  useEffect(() => {
    if (step !== "generating" || !parsedScenario?.title) {
      // Only clear fun facts when going back to input, not when viewing results
      if (step === "input") {
        setFunFacts([]);
        setFactIndex(0);
      }
      return;
    }

    let cancelled = false;

    const fetchFact = async () => {
      // Stop if we already have max facts
      if (funFactsRef.current.length >= MAX_FUN_FACTS) return;

      try {
        // Fade out current fact
        setFactFading(true);
        await new Promise((r) => setTimeout(r, 300));

        if (cancelled) return;

        const result = await generateFunFact({
          title: parsedScenario.title,
          previousFacts: funFactsRef.current,
        });
        if (cancelled) return;

        if (result.fact) {
          setFunFacts((prev) => [...prev, result.fact]);
          setFactIndex((prev) => prev + 1);
        }
        setFactFading(false);
      } catch (err) {
        console.error("Failed to fetch fun fact:", err);
        setFactFading(false);
      }
    };

    // Start cycling after 20 seconds (first fact is already pre-loaded)
    const interval = setInterval(fetchFact, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, parsedScenario?.title, generateFunFact]);

  // Step 1: Parse the prompt
  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isParsing) return;

    setIsParsing(true);
    setError(null);

    try {
      const result = await parsePrompt({ prompt: prompt.trim() });

      // Check if AI returned an error (use 'in' for proper type narrowing)
      if (result && 'error' in result) {
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

      // Pre-generate the first fun fact so it's ready when generation starts
      generateFunFact({ title: result.title })
        .then((factResult) => {
          if (factResult.fact) {
            setFunFacts([factResult.fact]);
            setFactIndex(0);
          }
        })
        .catch((err) => console.error("Failed to pre-generate fun fact:", err));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse scenario");
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2: Generate scores after confirmation
  const handleConfirm = async () => {
    if (!parsedScenario || !getActiveMapVersion) return;

    setStep("generating");
    setError(null);

    try {
      // Calculate batch info for initialization
      const BATCH_SIZE = 10;
      const totalBatches = Math.ceil(getActiveMapVersion.countries.length / BATCH_SIZE) * numRuns;

      // Initialize scenario (fast mutation - returns immediately)
      const { issueId, jobId: newJobId } = await initializeScenario({
        title: parsedScenario.title,
        description: parsedScenario.description,
        primaryActor: parsedScenario.primaryActor,
        sideA: parsedScenario.sideA,
        sideB: parsedScenario.sideB,
        mapVersionId: getActiveMapVersion._id,
        userId: userId || undefined,
        totalBatches,
        totalRuns: numRuns,
      });

      // Set state immediately to start real-time polling
      setJobId(newJobId);
      setCurrentIssue({
        id: issueId,
        title: parsedScenario.title,
        description: parsedScenario.description,
        primaryActor: parsedScenario.primaryActor,
        sideA: parsedScenario.sideA,
        sideB: parsedScenario.sideB,
      });

      // Start batch processing (fire-and-forget, don't await)
      processScenarioBatches({
        issueId,
        jobId: newJobId,
        title: parsedScenario.title,
        description: parsedScenario.description,
        sideA: parsedScenario.sideA,
        sideB: parsedScenario.sideB,
        numRuns,
      }).catch((err) => {
        console.error("Batch processing error:", err);
        setError(err instanceof Error ? err.message : "Failed to process batches");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("confirm");
    }
  };

  // Select a saved scenario to view
  const handleSelectScenario = (scenario: SavedScenario) => {
    if (currentIssue?.id === scenario._id) {
      // Deselect - go back to input
      handleClear();
    } else {
      setCurrentIssue({
        id: scenario._id,
        title: scenario.title,
        description: scenario.description,
        primaryActor: scenario.primaryActor,
        sideA: scenario.sideA,
        sideB: scenario.sideB,
      });
      setScores({}); // Clear scores, will load via query
      setStep("results");
      setParsedScenario(null);
      setPrompt("");
      setJobId(null);
      setError(null);
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
    setFunFacts([]);
    setFactIndex(0);
    setFactFading(false);
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

  const hasResults = currentIssue && Object.keys(scores).length > 0;

  // Delete a scenario
  const handleDelete = async (e: React.MouseEvent, scenarioId: Id<"issues">) => {
    e.stopPropagation(); // Prevent selecting the scenario
    if (!confirm("Are you sure you want to delete this scenario?")) return;

    try {
      await deleteScenario({ issueId: scenarioId });
      // If we deleted the currently viewed scenario, clear the view
      if (currentIssue?.id === scenarioId) {
        handleClear();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scenario");
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <RequireAuth
      title="AI Scenario Generator"
      description="Create custom geopolitical scenarios and see how countries might align. Sign in to generate your own scenarios."
    >
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex overflow-hidden">
        {/* Sidebar - Saved scenarios */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-lg font-bold text-slate-900">My Scenarios</h1>
            <p className="text-sm text-slate-600 mt-1">
              Your generated scenario maps
            </p>
          </div>

          {/* New Scenario button */}
          <div className="p-2 border-b border-slate-200">
            <Button
              onClick={handleClear}
              variant={step === "input" && !currentIssue ? "default" : "outline"}
              className="w-full justify-start gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Scenario
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {!userScenarios && (
              <div className="p-4 text-center text-slate-500">Loading...</div>
            )}

            {userScenarios && userScenarios.length === 0 && (
              <div className="p-4 text-center text-slate-500">
                No scenarios yet. Create your first one!
              </div>
            )}

            <div className="space-y-2">
              {userScenarios?.map((scenario) => (
                <div
                  key={scenario._id}
                  className={`relative group w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    currentIssue?.id === scenario._id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                  onClick={() => handleSelectScenario(scenario)}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, scenario._id)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-400 hover:text-red-600 transition-all"
                    title="Delete scenario"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="font-medium text-slate-900 text-sm leading-snug pr-6">
                    {scenario.title}
                  </div>
                  {scenario.primaryActor && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      by {scenario.primaryActor}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-blue-600">{scenario.sideA.label}</span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-red-600">{scenario.sideB.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(scenario.generatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header section - only show when creating new scenario */}
          {(step === "input" || step === "confirm" || step === "generating") && (
            <div className="bg-white border-b border-slate-200 px-6 py-6">
              <div className="max-w-3xl">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {step === "input" && "Create New Scenario"}
                  {step === "confirm" && "Confirm Scenario"}
                  {step === "generating" && "Generating..."}
                </h2>
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

                    {/* Primary Actor - click to edit */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Primary Actor(s):</span>
                      {editingField === "primaryActor" ? (
                        <input
                          type="text"
                          value={parsedScenario.primaryActor || ""}
                          onChange={(e) => setParsedScenario({ ...parsedScenario, primaryActor: e.target.value })}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                          autoFocus
                          placeholder="e.g., United States, The UN, Western Nations"
                          className="flex-1 max-w-xs text-slate-900 text-sm px-2 py-1 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingField("primaryActor")}
                          className="group flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 transition-colors"
                          title="Click to edit"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {parsedScenario.primaryActor || "Not specified"}
                          </span>
                          <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <Button onClick={handleConfirm} className="px-6" disabled={!getActiveMapVersion}>
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
                    </p>
                  </div>
                )}

                {/* Error display */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 max-h-32 overflow-y-auto">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="break-words">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fun facts banner - shown during and after generation */}
          {(step === "generating" || step === "results") && funFacts.length > 0 && (
            <div
              className={`bg-amber-50 border-b border-amber-200 px-6 py-3 transition-opacity duration-300 ${
                factFading ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-amber-500 text-lg">💡</span>
                <div className="flex items-center gap-2">
                  {factIndex > 0 && (
                    <button
                      onClick={() => setFactIndex((i) => i - 1)}
                      className="p-1 rounded hover:bg-amber-100 text-amber-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <p className="text-sm text-amber-800 italic text-center max-w-prose">{funFacts[factIndex]}</p>
                  {factIndex < funFacts.length - 1 && (
                    <button
                      onClick={() => setFactIndex((i) => i + 1)}
                      className="p-1 rounded hover:bg-amber-100 text-amber-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                {funFacts.length > 1 && (
                  <div className="flex gap-1 mt-1">
                    {funFacts.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFactIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === factIndex ? "bg-amber-500" : "bg-amber-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results header (when viewing results) */}
          {hasResults && currentIssue && (
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{currentIssue.title}</h2>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    {currentIssue.primaryActor && (
                      <>
                        <span className="text-slate-600">
                          <span className="text-slate-400">by</span> {currentIssue.primaryActor}
                        </span>
                        <span className="text-slate-300">|</span>
                      </>
                    )}
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
            {currentIssue && (step === "generating" || hasResults) && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-4 py-3">
                <ScoreLegend
                  sideALabel={currentIssue.sideA.label}
                  sideBLabel={currentIssue.sideB.label}
                  showPending={step === "generating"}
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
            {step === "input" && !isParsing && !currentIssue && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-slate-500 max-w-md px-4">
                  <div className="text-6xl mb-4 opacity-50">🌍</div>
                  <p className="text-lg">
                    Enter a geopolitical scenario above to see how countries might align.
                  </p>
                </div>
              </div>
            )}

            {/* Loading state for saved scenario */}
            {currentIssue && !hasResults && step === "results" && (
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
    </RequireAuth>
  );
}
