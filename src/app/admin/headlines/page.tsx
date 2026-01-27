"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import Image from "next/image";
import { X, ImageIcon } from "lucide-react";

interface ParsedHeadline {
  title: string;
  slug: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
}

interface Headline {
  _id: Id<"headlines">;
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
}

type Step = "input" | "confirm" | "generating";
type ModelChoice = "2.0-flash" | "2.5-flash" | "3.0-flash" | "3.0-flash-fallback" | "3.0-pro";

const MODEL_OPTIONS: { value: ModelChoice; label: string }[] = [
  { value: "3.0-flash-fallback", label: "Flash 3.0 (fallback to 2.5)" },
  { value: "3.0-flash", label: "Flash 3.0" },
  { value: "3.0-pro", label: "Pro 3.0" },
  { value: "2.5-flash", label: "Flash 2.5" },
  { value: "2.0-flash", label: "Flash 2.0" },
];

type TabType = "featured" | "active" | "archived";

// Headline card component with image support
function HeadlineCard({
  headline,
  tab,
  isUploading,
  onFeature,
  onUnfeature,
  onArchive,
  onUnarchive,
  onDelete,
  onImageUpload,
  onImageDelete,
  onRerunMissing,
  isRerunning,
  formatDate,
}: {
  headline: Headline;
  tab: TabType;
  isUploading: boolean;
  onFeature: () => void;
  onUnfeature: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onImageUpload: (file: File) => void;
  onImageDelete: () => void;
  onRerunMissing: () => void;
  isRerunning: boolean;
  formatDate: (timestamp: number) => string;
}) {
  const imageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline.imageId ? { headlineId: headline._id } : "skip"
  );
  const missingData = useQuery(api.headlines.getMissingCountries, { headlineId: headline._id });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const borderColor = headline.isFeatured
    ? "border-amber-300 bg-amber-50"
    : headline.isActive
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
              alt={headline.title}
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
              {headline.isFeatured && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-200 text-amber-700">
                  Featured
                </span>
              )}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  headline.isActive
                    ? "bg-green-200 text-green-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {headline.isActive ? "Active" : "Archived"}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(headline.generatedAt)}
              </span>
            </div>
            <h3 className="font-medium text-slate-900 mt-1">{headline.title}</h3>
            {headline.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {headline.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-blue-600">{headline.sideA.label}</span>
              <span className="text-slate-400">vs</span>
              <span className="text-red-600">{headline.sideB.label}</span>
            </div>
            {/* Missing countries indicator */}
            {missingData && missingData.missing.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={onRerunMissing}
                  disabled={isRerunning}
                  className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRerunning ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border border-orange-700 border-t-transparent rounded-full animate-spin" />
                      Re-running...
                    </span>
                  ) : (
                    `${missingData.missing.length} missing – Re-run`
                  )}
                </button>
              </div>
            )}
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
  const isAdmin = useQuery(api.headlines.isCurrentUserAdmin);

  // Step tracking
  const [step, setStep] = useState<Step>("input");
  const [prompt, setPrompt] = useState("");
  const [useWebGroundingParse, setUseWebGroundingParse] = useState(true);
  const [useWebGroundingScores, setUseWebGroundingScores] = useState(true);
  const [modelParse, setModelParse] = useState<ModelChoice>("3.0-flash-fallback");
  const [modelScores, setModelScores] = useState<ModelChoice>("3.0-flash-fallback");
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("featured");
  const [parsedHeadline, setParsedHeadline] = useState<ParsedHeadline | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<Id<"generationJobs"> | null>(null);
  const [generatingHeadlineId, setGeneratingHeadlineId] = useState<Id<"headlines"> | null>(null);
  const [numRuns, setNumRuns] = useState(1); // Default 1 run (fastest)
  const [batchSize, setBatchSize] = useState(3); // Countries per batch

  // Queries
  const featuredHeadlines = useQuery(api.headlines.getFeaturedHeadlines) as Headline[] | undefined;
  const activeHeadlines = useQuery(api.headlines.getActiveHeadlines) as Headline[] | undefined;
  const archivedHeadlines = useQuery(api.headlines.getArchivedHeadlines) as Headline[] | undefined;
  const getActiveMapVersion = useQuery(api.headlines.getActiveMapVersion);
  const recentDrafts = useQuery(api.headlines.getRecentDrafts, { limit: 10 });

  const displayedHeadlines =
    activeTab === "featured"
      ? featuredHeadlines || []
      : activeTab === "active"
        ? activeHeadlines || []
        : archivedHeadlines || [];

  // Actions and mutations
  const parsePrompt = useAction(api.ai.parsePromptToSides);
  const initializeHeadline = useMutation(api.headlines.initializeHeadline);
  const processHeadlineBatches = useAction(api.ai.processHeadlineBatches);
  const featureHeadlineMutation = useMutation(api.headlines.featureHeadline);
  const unfeatureHeadlineMutation = useMutation(api.headlines.unfeatureHeadline);
  const archiveHeadlineMutation = useMutation(api.headlines.archiveHeadline);
  const unarchiveHeadlineMutation = useMutation(api.headlines.unarchiveHeadline);
  const generateUploadUrl = useMutation(api.headlines.generateUploadUrl);
  const updateHeadlineImage = useMutation(api.headlines.updateHeadlineImage);
  const deleteHeadlineImage = useMutation(api.headlines.deleteHeadlineImage);
  const saveDraft = useMutation(api.headlines.saveDraft);
  const rerunMissingScores = useAction(api.ai.rerunMissingHeadlineScores);

  // Image upload state
  const [uploadingHeadlineId, setUploadingHeadlineId] = useState<Id<"headlines"> | null>(null);
  const [rerunningHeadlineId, setRerunningHeadlineId] = useState<Id<"headlines"> | null>(null);

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
      setGeneratingHeadlineId(null);
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

      // Auto-save as draft
      await saveDraft({
        title: result.title,
        description: result.description,
        primaryActor: result.primaryActor,
        sideA: result.sideA,
        sideB: result.sideB,
        originalPrompt: prompt.trim(),
      }).catch(() => {}); // Silently fail - drafts are optional

      setParsedHeadline(result);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse headline");
    } finally {
      setIsParsing(false);
    }
  };

  // Load from draft
  const handleLoadDraft = (draft: NonNullable<typeof recentDrafts>[number]) => {
    setParsedHeadline({
      title: draft.title,
      description: draft.description,
      primaryActor: draft.primaryActor,
      sideA: draft.sideA,
      sideB: draft.sideB,
    });
    if (draft.originalPrompt) {
      setPrompt(draft.originalPrompt);
    }
    setStep("confirm");
  };

  // Generate headline
  const handleGenerate = async () => {
    if (!parsedHeadline || !getActiveMapVersion) return;

    setStep("generating");
    setError(null);

    try {
      const totalCountries = getActiveMapVersion.countries.length;
      const totalBatches = Math.ceil(totalCountries / batchSize) * numRuns;

      const { headlineId, jobId: newJobId } = await initializeHeadline({
        title: parsedHeadline.title,
        slug: parsedHeadline.slug,
        description: parsedHeadline.description,
        primaryActor: parsedHeadline.primaryActor,
        sideA: parsedHeadline.sideA,
        sideB: parsedHeadline.sideB,
        mapVersionId: getActiveMapVersion._id,
        totalBatches,
        totalRuns: numRuns,
        totalCountries,
        isActive: true,
      });

      setJobId(newJobId);
      setGeneratingHeadlineId(headlineId);

      processHeadlineBatches({
        headlineId,
        jobId: newJobId,
        title: parsedHeadline.title,
        description: parsedHeadline.description,
        sideA: parsedHeadline.sideA,
        sideB: parsedHeadline.sideB,
        numRuns,
        useWebGrounding: useWebGroundingScores,
        modelChoice: modelScores,
        batchSize,
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
  const handleFeature = async (headlineId: Id<"headlines">) => {
    try {
      await featureHeadlineMutation({ headlineId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to feature");
    }
  };

  // Unfeature a headline
  const handleUnfeature = async (headlineId: Id<"headlines">) => {
    try {
      await unfeatureHeadlineMutation({ headlineId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unfeature");
    }
  };

  // Archive a headline
  const handleArchive = async (headlineId: Id<"headlines">) => {
    try {
      await archiveHeadlineMutation({ headlineId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  // Unarchive a headline
  const handleUnarchive = async (headlineId: Id<"headlines">) => {
    try {
      await unarchiveHeadlineMutation({ headlineId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive");
    }
  };

  // Delete headline - not implemented yet for headlines table
  const handleDelete = async (headlineId: Id<"headlines">) => {
    if (!confirm("Are you sure you want to delete this headline?")) return;
    setError("Delete not yet implemented for headlines table");
  };

  // Cancel/reset
  const handleCancel = () => {
    setStep("input");
    setParsedHeadline(null);
    setEditingField(null);
    setError(null);
    setNumRuns(1);
    setBatchSize(3);
  };

  // Re-run missing scores handler
  const handleRerunMissing = async (headlineId: Id<"headlines">) => {
    setRerunningHeadlineId(headlineId);
    setError(null);

    try {
      const result = await rerunMissingScores({
        headlineId,
        useWebGrounding: useWebGroundingScores,
        modelChoice: modelScores,
      });

      if (!result.success) {
        setError(result.error || "Failed to re-run missing scores");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to re-run missing scores");
    } finally {
      setRerunningHeadlineId(null);
    }
  };

  // Image upload handler
  const handleImageUpload = async (headlineId: Id<"headlines">, file: File) => {
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

    setUploadingHeadlineId(headlineId);
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

      // Update the headline with the image ID
      await updateHeadlineImage({ headlineId, imageId: storageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingHeadlineId(null);
    }
  };

  // Delete image handler
  const handleDeleteImage = async (headlineId: Id<"headlines">) => {
    try {
      await deleteHeadlineImage({ headlineId });
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
            <div className="space-y-4">
              {/* Recent Drafts dropdown */}
              {recentDrafts && recentDrafts.length > 0 && (
                <div className="border border-slate-200 rounded-lg bg-white">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recent Drafts</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {recentDrafts.map((draft) => (
                      <button
                        key={draft._id}
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-50 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-slate-800 truncate">{draft.title}</div>
                        <div className="text-xs text-slate-500 truncate">{draft.originalPrompt || draft.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
            </div>
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

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">URL Slug</label>
                {editingField === "slug" ? (
                  <input
                    type="text"
                    value={parsedHeadline.slug}
                    onChange={(e) => setParsedHeadline({ ...parsedHeadline, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="w-full text-sm font-mono px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <div
                    onClick={() => setEditingField("slug")}
                    className="text-sm font-mono text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    /headlines/{parsedHeadline.slug}
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
                    <label htmlFor="batchSize" className="text-sm text-slate-600">Batch:</label>
                    <select
                      id="batchSize"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
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
              Featured ({featuredHeadlines?.length || 0}/2)
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "active"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active ({activeHeadlines?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "archived"
                  ? "bg-slate-200 text-slate-700 border border-slate-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Archived ({archivedHeadlines?.length || 0})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {displayedHeadlines.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              {activeTab === "featured" && "No featured headlines. Feature up to 2 headlines to show them prominently."}
              {activeTab === "active" && "No active headlines. Create one!"}
              {activeTab === "archived" && "No archived headlines."}
            </div>
          )}

          <div className="space-y-3">
            {displayedHeadlines.map((headline) => (
              <HeadlineCard
                key={headline._id}
                headline={headline}
                tab={activeTab}
                isUploading={uploadingHeadlineId === headline._id}
                onFeature={() => handleFeature(headline._id)}
                onUnfeature={() => handleUnfeature(headline._id)}
                onArchive={() => handleArchive(headline._id)}
                onUnarchive={() => handleUnarchive(headline._id)}
                onDelete={() => handleDelete(headline._id)}
                onImageUpload={(file) => handleImageUpload(headline._id, file)}
                onImageDelete={() => handleDeleteImage(headline._id)}
                onRerunMissing={() => handleRerunMissing(headline._id)}
                isRerunning={rerunningHeadlineId === headline._id}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
