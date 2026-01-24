"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";

interface ParsedHeadline {
  title: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
}

interface DailyIssue {
  _id: Id<"issues">;
  title: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
  generatedAt: number;
  isActive: boolean;
}

type Step = "input" | "confirm" | "generating";
type ModelChoice = "2.5" | "3.0" | "3.0-fallback";

const MODEL_OPTIONS: { value: ModelChoice; label: string }[] = [
  { value: "3.0-fallback", label: "Flash 3.0 (fallback to 2.5)" },
  { value: "3.0", label: "Flash 3.0" },
  { value: "2.5", label: "Flash 2.5" },
];

export default function AdminHeadlinesPage() {
  // Auth check
  const isAdmin = useQuery(api.issues.isCurrentUserAdmin);

  // Step tracking
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [useWebGroundingParse, setUseWebGroundingParse] = useState(true);
  const [useWebGroundingScores, setUseWebGroundingScores] = useState(true);
  const [modelParse, setModelParse] = useState<ModelChoice>("3.0-fallback");
  const [modelScores, setModelScores] = useState<ModelChoice>("3.0-fallback");
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<"visible" | "hidden">("visible");
  const [parsedHeadline, setParsedHeadline] = useState<ParsedHeadline | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<Id<"generationJobs"> | null>(null);
  const [generatingIssueId, setGeneratingIssueId] = useState<Id<"issues"> | null>(null);

  // Queries
  const allDailyIssues = useQuery(api.issues.getAllDailyIssues) as DailyIssue[] | undefined;
  const visibleIssues = allDailyIssues?.filter((issue) => issue.isActive) || [];
  const hiddenIssues = allDailyIssues?.filter((issue) => !issue.isActive) || [];
  const displayedIssues = activeTab === "visible" ? visibleIssues : hiddenIssues;
  const getActiveMapVersion = useQuery(api.issues.getActiveMapVersion);

  // Actions and mutations
  const parsePrompt = useAction(api.ai.parsePromptToSides);
  const initializeScenario = useMutation(api.issues.initializeScenario);
  const processScenarioBatches = useAction(api.ai.processScenarioBatches);
  const updateIssueActive = useMutation(api.issues.updateIssueActive);
  const deleteScenario = useMutation(api.issues.deleteScenario);

  // Poll job status when generating
  const jobStatus = useQuery(
    api.issues.getJobById,
    jobId ? { jobId } : "skip"
  );

  // Check if generation completed
  useEffect(() => {
    if (jobStatus?.status === "completed" && step === "generating") {
      setStep("input");
      setPrompt("");
      setParsedHeadline(null);
      setJobId(null);
      setGeneratingIssueId(null);
    }
  }, [jobStatus, step]);

  // Parse prompt
  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isParsing) return;

    setIsParsing(true);
    setError(null);

    try {
      const result = await parsePrompt({ prompt: prompt.trim(), useWebGrounding: useWebGroundingParse, modelChoice: modelParse });

      if (result && "error" in result) {
        setError(result.error);
        return;
      }

      if (!result?.title || !result?.sideA?.label || !result?.sideB?.label) {
        setError("AI returned an invalid response. Please try again.");
        return;
      }

      setParsedHeadline(result);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse headline");
    } finally {
      setIsParsing(false);
    }
  };

  // Generate headline
  const handleGenerate = async () => {
    if (!parsedHeadline || !getActiveMapVersion) return;

    setStep("generating");
    setError(null);

    try {
      const BATCH_SIZE = 10;
      const totalCountries = getActiveMapVersion.countries.length;
      const numRuns = 2;
      const totalBatches = Math.ceil(totalCountries / BATCH_SIZE) * numRuns;

      const { issueId, jobId: newJobId } = await initializeScenario({
        title: parsedHeadline.title,
        description: parsedHeadline.description,
        primaryActor: parsedHeadline.primaryActor,
        sideA: parsedHeadline.sideA,
        sideB: parsedHeadline.sideB,
        mapVersionId: getActiveMapVersion._id,
        totalBatches,
        totalRuns: numRuns,
        totalCountries,
        source: "daily",
        isActive: true,
      });

      setJobId(newJobId);
      setGeneratingIssueId(issueId);

      processScenarioBatches({
        issueId,
        jobId: newJobId,
        title: parsedHeadline.title,
        description: parsedHeadline.description,
        sideA: parsedHeadline.sideA,
        sideB: parsedHeadline.sideB,
        numRuns,
        useWebGrounding: useWebGroundingScores,
        modelChoice: modelScores,
      }).catch((err) => {
        console.error("Batch processing error:", err);
        setError(err instanceof Error ? err.message : "Failed to generate");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("confirm");
    }
  };

  // Toggle headline active status
  const handleToggleActive = async (issueId: Id<"issues">, currentlyActive: boolean) => {
    try {
      await updateIssueActive({ issueId, isActive: !currentlyActive });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  // Delete headline
  const handleDelete = async (issueId: Id<"issues">) => {
    if (!confirm("Are you sure you want to delete this headline?")) return;
    try {
      await deleteScenario({ issueId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Cancel/reset
  const handleCancel = () => {
    setStep("input");
    setParsedHeadline(null);
    setEditingField(null);
    setError(null);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Not admin - show access denied
  if (isAdmin === false) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Loading admin status
  if (isAdmin === undefined) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex">
      {/* Left panel - Create headline */}
      <div className="w-1/2 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-amber-700 bg-amber-200 px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Create Daily Headline</h1>
          <p className="text-sm text-slate-600 mt-1">
            Generate AI country positions for current events
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input */}
          {step === "input" && (
            <form onSubmit={handleParse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  News headline or event
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Trump announces new tariffs on Chinese goods..."
                  disabled={isParsing}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWebGroundingParse}
                      onChange={(e) => setUseWebGroundingParse(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">Web grounding</span>
                  </label>
                  <select
                    value={modelParse}
                    onChange={(e) => setModelParse(e.target.value as ModelChoice)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {MODEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isParsing || !prompt.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {isParsing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Parsing...
                  </span>
                ) : (
                  "Parse Headline"
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && parsedHeadline && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                {editingField === "title" ? (
                  <input
                    type="text"
                    value={parsedHeadline.title}
                    onChange={(e) => setParsedHeadline({ ...parsedHeadline, title: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full text-lg font-semibold px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField("title")}
                    className="text-lg font-semibold text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {parsedHeadline.title}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                {editingField === "description" ? (
                  <textarea
                    value={parsedHeadline.description}
                    onChange={(e) => setParsedHeadline({ ...parsedHeadline, description: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={2}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField("description")}
                    className="text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {parsedHeadline.description}
                  </div>
                )}
              </div>

              {/* Primary Actor */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Primary Actor</label>
                {editingField === "primaryActor" ? (
                  <input
                    type="text"
                    value={parsedHeadline.primaryActor || ""}
                    onChange={(e) => setParsedHeadline({ ...parsedHeadline, primaryActor: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    placeholder="e.g., United States"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField("primaryActor")}
                    className="text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    {parsedHeadline.primaryActor || <span className="text-slate-400 italic">Not specified</span>}
                  </div>
                )}
              </div>

              {/* Sides */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="font-medium text-blue-900">{parsedHeadline.sideA.label}</span>
                  </div>
                  <p className="text-sm text-blue-700">{parsedHeadline.sideA.description}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-red-600" />
                    <span className="font-medium text-red-900">{parsedHeadline.sideB.label}</span>
                  </div>
                  <p className="text-sm text-red-700">{parsedHeadline.sideB.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWebGroundingScores}
                    onChange={(e) => setUseWebGroundingScores(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700">Web grounding</span>
                </label>
                <select
                  value={modelScores}
                  onChange={(e) => setModelScores(e.target.value as ModelChoice)}
                  className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!getActiveMapVersion}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Generate Headline
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === "generating" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-slate-900">
                {parsedHeadline?.title}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-amber-700 font-medium">Generating country positions...</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>Progress</span>
                    <span>
                      {jobStatus?.completedCountries || 0} of {jobStatus?.totalCountries || "?"} countries
                    </span>
                  </div>
                  <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full transition-all duration-300"
                      style={{ width: `${jobStatus?.progress || 0}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-amber-600">
                    {jobStatus?.progress || 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Existing headlines */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Existing Headlines</h2>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveTab("visible")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "visible"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Visible ({visibleIssues.length})
            </button>
            <button
              onClick={() => setActiveTab("hidden")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "hidden"
                  ? "bg-slate-200 text-slate-700 border border-slate-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Hidden ({hiddenIssues.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {displayedIssues.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              {activeTab === "visible" ? "No visible headlines. Create one!" : "No hidden headlines."}
            </div>
          )}

          <div className="space-y-3">
            {displayedIssues.map((issue) => (
              <div
                key={issue._id}
                className={`p-4 rounded-lg border ${
                  issue.isActive
                    ? "border-green-200 bg-green-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          issue.isActive
                            ? "bg-green-200 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {issue.isActive ? "Active" : "Hidden"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(issue.generatedAt)}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 mt-1">{issue.title}</h3>
                    {issue.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-blue-600">{issue.sideA.label}</span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-red-600">{issue.sideB.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(issue._id, issue.isActive)}
                      className="text-xs"
                    >
                      {issue.isActive ? "Hide" : "Unhide"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(issue._id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
