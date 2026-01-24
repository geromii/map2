import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============ QUERIES ============

// Get current authenticated user ID
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId;
  },
});

// Get current active daily issues (public)
export const getActiveIssues = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get all country scores for an issue
export const getIssueScores = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
  },
});

// Get issue details by ID
export const getIssueById = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.issueId);
  },
});

// Get issue with its associated map version for validation
export const getIssueWithMapVersion = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return null;

    const mapVersion = await ctx.db.get(issue.mapVersionId);
    return { issue, mapVersion };
  },
});

// Get the active map version for new issues
export const getActiveMapVersion = query({
  args: {},
  handler: async (ctx) => {
    const activeVersions = await ctx.db
      .query("mapVersions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return activeVersions[0] ?? null;
  },
});

// Get map version by ID
export const getMapVersionById = query({
  args: { mapVersionId: v.id("mapVersions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mapVersionId);
  },
});

// Get user's custom prompt history (authenticated)
export const getUserPrompts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("customPrompts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get user's custom scenarios/issues (authenticated)
export const getUserScenarios = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("issues")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get a specific prompt by ID
export const getPromptById = query({
  args: { promptId: v.id("customPrompts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.promptId);
  },
});

// Get job status for an issue
export const getJobStatus = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .order("desc")
      .first();
    return jobs;
  },
});

// Get job by ID
export const getJobById = query({
  args: { jobId: v.id("generationJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// ============ MUTATIONS ============

// Create a new issue record
export const createIssue = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"),
    source: v.union(v.literal("daily"), v.literal("custom")),
    isActive: v.optional(v.boolean()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const issueId = await ctx.db.insert("issues", {
      title: args.title,
      description: args.description,
      primaryActor: args.primaryActor,
      sideA: args.sideA,
      sideB: args.sideB,
      mapVersionId: args.mapVersionId,
      generatedAt: Date.now(),
      isActive: args.isActive ?? false,
      source: args.source,
      userId: args.userId,
    });
    return issueId;
  },
});

// Bulk save country scores for an issue
export const saveCountryScores = mutation({
  args: {
    issueId: v.id("issues"),
    scores: v.array(
      v.object({
        countryName: v.string(),
        score: v.float64(),
        reasoning: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete any existing scores for this issue first
    const existingScores = await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    for (const score of existingScores) {
      await ctx.db.delete(score._id);
    }

    // Insert new scores
    for (const score of args.scores) {
      await ctx.db.insert("countryScores", {
        issueId: args.issueId,
        countryName: score.countryName,
        score: Math.max(-1, Math.min(1, score.score)), // Clamp to [-1, 1]
        reasoning: score.reasoning,
      });
    }

    return { savedCount: args.scores.length };
  },
});

// Upsert batch scores incrementally (for real-time map updates)
// If a score already exists, it averages the new score with the existing one
export const upsertBatchScores = mutation({
  args: {
    issueId: v.id("issues"),
    scores: v.array(
      v.object({
        countryName: v.string(),
        score: v.float64(),
        reasoning: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const newScore of args.scores) {
      // Check if score already exists for this country
      const existing = await ctx.db
        .query("countryScores")
        .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
        .filter((q) => q.eq(q.field("countryName"), newScore.countryName))
        .first();

      if (existing) {
        // Average with existing score (for multiple runs)
        // We track count implicitly: if existing has been updated N times,
        // new average = (existing.score * N + newScore) / (N + 1)
        // For simplicity, we just do a running average: (old + new) / 2
        const avgScore = (existing.score + newScore.score) / 2;
        await ctx.db.patch(existing._id, {
          score: Math.max(-1, Math.min(1, avgScore)),
          reasoning: newScore.reasoning || existing.reasoning,
        });
      } else {
        // Insert new score
        await ctx.db.insert("countryScores", {
          issueId: args.issueId,
          countryName: newScore.countryName,
          score: Math.max(-1, Math.min(1, newScore.score)),
          reasoning: newScore.reasoning,
        });
      }
    }

    return { upsertedCount: args.scores.length };
  },
});

// Submit a custom prompt (authenticated)
export const submitCustomPrompt = mutation({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const promptId = await ctx.db.insert("customPrompts", {
      userId,
      prompt: args.prompt,
      status: "pending",
      createdAt: Date.now(),
    });

    return promptId;
  },
});

// Update prompt status
export const updatePromptStatus = mutation({
  args: {
    promptId: v.id("customPrompts"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    issueId: v.optional(v.id("issues")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: {
      status: "pending" | "processing" | "completed" | "failed";
      issueId?: typeof args.issueId;
      error?: string;
    } = {
      status: args.status,
    };

    if (args.issueId) {
      updateData.issueId = args.issueId;
    }
    if (args.error) {
      updateData.error = args.error;
    }

    await ctx.db.patch(args.promptId, updateData);
  },
});

// Update issue active status
export const updateIssueActive = mutation({
  args: {
    issueId: v.id("issues"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.issueId, { isActive: args.isActive });
  },
});

// Create a generation job
export const createGenerationJob = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("generationJobs", {
      issueId: args.issueId,
      status: "pending",
    });
    return jobId;
  },
});

// Update generation job status
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("generationJobs"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    )),
    progress: v.optional(v.number()),
    totalBatches: v.optional(v.number()),
    completedBatches: v.optional(v.number()),
    currentRun: v.optional(v.number()),
    totalRuns: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (args.status !== undefined) {
      updateData.status = args.status;

      if (args.status === "running") {
        updateData.startedAt = Date.now();
      }
      if (args.status === "completed" || args.status === "failed") {
        updateData.completedAt = Date.now();
      }
    }

    if (args.progress !== undefined) updateData.progress = args.progress;
    if (args.totalBatches !== undefined) updateData.totalBatches = args.totalBatches;
    if (args.completedBatches !== undefined) updateData.completedBatches = args.completedBatches;
    if (args.currentRun !== undefined) updateData.currentRun = args.currentRun;
    if (args.totalRuns !== undefined) updateData.totalRuns = args.totalRuns;
    if (args.error !== undefined) updateData.error = args.error;

    await ctx.db.patch(args.jobId, updateData);
  },
});

// Initialize a scenario (create issue + job) and return IDs for real-time polling
export const initializeScenario = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"),
    userId: v.optional(v.string()),
    totalBatches: v.number(),
    totalRuns: v.number(),
  },
  handler: async (ctx, args) => {
    // Create issue
    const issueId = await ctx.db.insert("issues", {
      title: args.title,
      description: args.description,
      primaryActor: args.primaryActor,
      sideA: args.sideA,
      sideB: args.sideB,
      mapVersionId: args.mapVersionId,
      generatedAt: Date.now(),
      isActive: false,
      source: "custom",
      userId: args.userId,
    });

    // Create job
    const jobId = await ctx.db.insert("generationJobs", {
      issueId,
      status: "running",
      progress: 0,
      totalBatches: args.totalBatches,
      completedBatches: 0,
      currentRun: 1,
      totalRuns: args.totalRuns,
      startedAt: Date.now(),
    });

    return { issueId, jobId };
  },
});

// Create generation job with initial progress info
export const createGenerationJobWithProgress = mutation({
  args: {
    issueId: v.id("issues"),
    totalBatches: v.number(),
    totalRuns: v.number(),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("generationJobs", {
      issueId: args.issueId,
      status: "running",
      progress: 0,
      totalBatches: args.totalBatches,
      completedBatches: 0,
      currentRun: 1,
      totalRuns: args.totalRuns,
      startedAt: Date.now(),
    });
    return jobId;
  },
});

// Delete a scenario and all associated data (authenticated, owner only)
export const deleteScenario = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get the issue and verify ownership
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Scenario not found");
    }
    if (issue.userId !== userId) {
      throw new Error("You can only delete your own scenarios");
    }

    // Delete all country scores for this issue
    const scores = await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }

    // Delete all generation jobs for this issue
    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }

    // Delete the issue itself
    await ctx.db.delete(args.issueId);

    return { success: true };
  },
});

// Create initial map version (for seeding)
export const createMapVersion = mutation({
  args: {
    version: v.string(),
    topojsonFile: v.string(),
    countriesFile: v.string(),
    countryCount: v.number(),
    countries: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // If setting as active, deactivate all other versions
    if (args.isActive) {
      const activeVersions = await ctx.db
        .query("mapVersions")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      for (const version of activeVersions) {
        await ctx.db.patch(version._id, { isActive: false });
      }
    }

    const mapVersionId = await ctx.db.insert("mapVersions", {
      version: args.version,
      topojsonFile: args.topojsonFile,
      countriesFile: args.countriesFile,
      countryCount: args.countryCount,
      countries: args.countries,
      createdAt: Date.now(),
      isActive: args.isActive,
    });

    return mapVersionId;
  },
});
