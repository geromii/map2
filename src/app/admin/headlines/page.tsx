"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";

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
  isFeatured?: boolean;
  featuredAt?: number;
  imageId?: Id<"_storage">;
  source: "daily" | "custom";
}

type Step = "input" | "confirm" | "generating";
type ModelChoice = "2.5" | "3.0" | "3.0-fallback";

const MODEL_OPTIONS: { value: ModelChoice; label: string }[] = [
  { value: "3.0-fallback", label: "Flash 3.0 (fallback to 2.5)" },
  { value: "3.0", label: "Flash 3.0" },
  { value: "2.5", label: "Flash 2.5" },
];

type TabType = "featured" | "active" | "archived";

// Headline card component with image support
function HeadlineCard({
  issue,
  tab,
  isUploading,
  onFeature,
  onUnfeature,
  onArchive,
  onUnarchive,
  onDelete,
  onImageUpload,
  onImageDelete,
  formatDate,
}: {
  issue: DailyIssue;
  tab: TabType;
  isUploading: boolean;
  onFeature: () => void;
  onUnfeature: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onImageUpload: (file: File) => void;
  onImageDelete: () => void;
  formatDate: (timestamp: number) => string;
}) {
  const imageUrl = useQuery(
    api.issues.getIssueImageUrl,
    issue.imageId ? { issueId: issue._id } : "skip"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const borderColor = issue.isFeatured
    ? "border-amber-300 bg-amber-50"
    : issue.isActive
      ? "border-green-200 bg-green-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-lg border overflow-hidden ${borderColor}`}>
      {/* Image section - 16:9 aspect ratio */}
      <div className="relative aspect-video bg-slate-200">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={issue.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <button
              onClick={onImageDelete}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            {isUploading ? (
              <>
                <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-2" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Upload image
                </button>
                <span className="text-xs mt-1">16:9 recommended</span>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Content section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {issue.isFeatured && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-200 text-amber-700">
                  Featured
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  issue.isActive
                    ? "bg-green-200 text-green-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {issue.isActive ? "Active" : "Archived"}
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
            {tab === "featured" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUnfeature}
                  className="text-xs"
                >
                  Unfeature
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onArchive}
                  className="text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                >
                  Archive
                </Button>
              </>
            )}
            {tab === "active" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onFeature}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Feature
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onArchive}
                  className="text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                >
                  Archive
                </Button>
              </>
            )}
            {tab === "archived" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUnarchive}
                  className="text-xs"
                >
                  Unarchive
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<TabType>("featured");
  const [parsedHeadline, setParsedHeadline] = useState<ParsedHeadline | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<Id<"generationJobs"> | null>(null);
  const [generatingIssueId, setGeneratingIssueId] = useState<Id<"issues"> | null>(null);
  const [numRuns, setNumRuns] = useState(1); // Default 1 run (fastest)

  // Queries
  const featuredIssues = useQuery(api.issues.getFeaturedIssues) as DailyIssue[] | undefined;
  const activeIssues = useQuery(api.issues.getActiveIssues) as DailyIssue[] | undefined;
  const archivedIssues = useQuery(api.issues.getArchivedIssues) as DailyIssue[] | undefined;
  const getActiveMapVersion = useQuery(api.issues.getActiveMapVersion);

  // Filter to only daily issues for each tab
  const featuredDailyIssues = featuredIssues?.filter((i) => i.source === "daily") || [];
  const activeDailyIssues = activeIssues?.filter((i) => i.source === "daily") || [];
  const archivedDailyIssues = archivedIssues || [];

  const displayedIssues =
    activeTab === "featured"
      ? featuredDailyIssues
      : activeTab === "active"
        ? activeDailyIssues
        : archivedDailyIssues;

  // Actions and mutations
  const parsePrompt = useAction(api.ai.parsePromptToSides);
  const initializeScenario = useMutation(api.issues.initializeScenario);
  const processScenarioBatches = useAction(api.ai.processScenarioBatches);
  const featureIssueMutation = useMutation(api.issues.featureIssue);
  const unfeatureIssueMutation = useMutation(api.issues.unfeatureIssue);
  const archiveIssueMutation = useMutation(api.issues.archiveIssue);
  const unarchiveIssueMutation = useMutation(api.issues.unarchiveIssue);
  const deleteScenario = useMutation(api.issues.deleteScenario);
  const generateUploadUrl = useMutation(api.issues.generateUploadUrl);
  const updateIssueImage = useMutation(api.issues.updateIssueImage);
  const deleteIssueImage = useMutation(api.issues.deleteIssueImage);

  // Image upload state
  const [uploadingIssueId, setUploadingIssueId] = useState<Id<"issues"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const BATCH_SIZE = 3; // Smaller batches for headlines (more detailed per-country analysis)
      const totalCountries = getActiveMapVersion.countries.length;
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
        batchSize: BATCH_SIZE,
      }).catch((err) => {
        console.error("Batch processing error:", err);
        setError(err instanceof Error ? err.message : "Failed to generate");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("confirm");
    }
  };

  // Feature a headline
  const handleFeature = async (issueId: Id<"issues">) => {
    try {
      await featureIssueMutation({ issueId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to feature");
    }
  };

  // Unfeature a headline
  const handleUnfeature = async (issueId: Id<"issues">) => {
    try {
      await unfeatureIssueMutation({ issueId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unfeature");
    }
  };

  // Archive a headline
  const handleArchive = async (issueId: Id<"issues">) => {
    try {
      await archiveIssueMutation({ issueId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  // Unarchive a headline
  const handleUnarchive = async (issueId: Id<"issues">) => {
    try {
      await unarchiveIssueMutation({ issueId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive");
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
    setNumRuns(1);
  };

  // Image upload handler
  const handleImageUpload = async (issueId: Id<"issues">, file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingIssueId(issueId);
    setError(null);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();

      // Update the issue with the image ID
      await updateIssueImage({ issueId, imageId: storageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingIssueId(null);
    }
  };

  // Delete image handler
  const handleDeleteImage = async (issueId: Id<"issues">) => {
    try {
      await deleteIssueImage({ issueId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="numRuns" className="text-sm text-slate-600">Runs:</label>
                    <select
                      id="numRuns"
                      value={numRuns}
                      onChange={(e) => setNumRuns(Number(e.target.value))}
                      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
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
              onClick={() => setActiveTab("featured")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "featured"
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Featured ({featuredDailyIssues.length}/2)
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "active"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active ({activeDailyIssues.length})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "archived"
                  ? "bg-slate-200 text-slate-700 border border-slate-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Archived ({archivedDailyIssues.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {displayedIssues.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              {activeTab === "featured" && "No featured headlines. Feature up to 2 headlines to show them prominently."}
              {activeTab === "active" && "No active headlines. Create one!"}
              {activeTab === "archived" && "No archived headlines."}
            </div>
          )}

          <div className="space-y-3">
            {displayedIssues.map((issue) => (
              <HeadlineCard
                key={issue._id}
                issue={issue}
                tab={activeTab}
                isUploading={uploadingIssueId === issue._id}
                onFeature={() => handleFeature(issue._id)}
                onUnfeature={() => handleUnfeature(issue._id)}
                onArchive={() => handleArchive(issue._id)}
                onUnarchive={() => handleUnarchive(issue._id)}
                onDelete={() => handleDelete(issue._id)}
                onImageUpload={(file) => handleImageUpload(issue._id, file)}
                onImageDelete={() => handleDeleteImage(issue._id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
