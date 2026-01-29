import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a random slug (8 chars, alphanumeric)
function generateRandomSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ============ QUERIES ============

// Get current authenticated user ID
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId;
  },
});

// Check if current user is an admin
export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const user = await ctx.db.get(userId);
    if (!user || !("email" in user) || !user.email) return false;

    const adminEmails = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map(e => e.trim()) || [];
    return adminEmails.includes((user.email as string).toLowerCase());
  },
});

// Get current active daily issues (public) - excludes featured issues
export const getActiveIssues = query({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(200);
    // Filter out featured issues (those go in getFeaturedIssues)
    return issues.filter((issue) => !issue.isFeatured);
  },
});

// Get featured daily issues (top 2 headlines with images)
export const getFeaturedIssues = query({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
    // Only return active featured issues, sorted by featuredAt (newest first)
    return issues
      .filter((issue) => issue.isActive)
      .sort((a, b) => (b.featuredAt ?? 0) - (a.featuredAt ?? 0));
  },
});

// Get archived issues (admin only)
export const getArchivedIssues = query({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .take(500);
    return issues.filter((issue) => issue.source === "daily");
  },
});

// Get all daily issues (for admin, includes hidden)
export const getAllDailyIssues = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_source", (q) => q.eq("source", "daily"))
      .take(500);
  },
});

// Get full reasoning for a single country (on-demand when user clicks for detail)
export const getCountryFullReasoning = query({
  args: {
    issueId: v.id("issues"),
    countryName: v.string(),
  },
  handler: async (ctx, args) => {
    const score = await ctx.db
      .query("countryScores")
      .withIndex("by_issue_country", (q) =>
        q.eq("issueId", args.issueId).eq("countryName", args.countryName)
      )
      .first();

    return score?.reasoning ?? null;
  },
});

// Get all country scores for an issue (aggregated/averaged by country)
// Uses embedded mapScores if available (1 doc read), falls back to table query (200+ doc reads)
export const getIssueScores = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    // Try to use embedded scores first (bandwidth optimized)
    const issue = await ctx.db.get(args.issueId);
    if (issue?.mapScores && issue.mapScores.length > 0) {
      // Convert from compact format { c, s, r } to { countryName, score, reasoning }
      return issue.mapScores.map((s) => ({
        countryName: s.c,
        score: s.s,
        reasoning: s.r, // Truncated preview for hover
      }));
    }

    // Fallback: query countryScores table (for unmigrated data or when reasoning needed)
    const rawScores = await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Aggregate scores by country name (average if multiple entries exist)
    const scoreMap = new Map<string, { total: number; count: number; reasoning?: string }>();

    for (const score of rawScores) {
      const existing = scoreMap.get(score.countryName);
      if (existing) {
        existing.total += score.score;
        existing.count += 1;
        // Keep first reasoning
      } else {
        scoreMap.set(score.countryName, {
          total: score.score,
          count: 1,
          reasoning: score.reasoning,
        });
      }
    }

    // Convert to array with averaged scores
    return Array.from(scoreMap.entries()).map(([countryName, data]) => ({
      countryName,
      score: data.total / data.count,
      reasoning: data.reasoning,
    }));
  },
});

// Get country counts by side for an issue (for headline cards)
// Uses embedded scoreCounts if available (already loaded with issue), falls back to table query
export const getIssueCounts = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    // Try to use embedded counts first (bandwidth optimized - issue already loaded)
    const issue = await ctx.db.get(args.issueId);
    if (issue?.scoreCounts) {
      return {
        sideA: issue.scoreCounts.a,
        sideB: issue.scoreCounts.b,
        neutral: issue.scoreCounts.n,
      };
    }

    // Fallback: query countryScores table (for unmigrated data)
    const rawScores = await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Aggregate scores by country (average if multiple entries)
    const scoreMap = new Map<string, number>();
    const countMap = new Map<string, number>();

    for (const score of rawScores) {
      const existing = scoreMap.get(score.countryName);
      if (existing !== undefined) {
        scoreMap.set(score.countryName, existing + score.score);
        countMap.set(score.countryName, (countMap.get(score.countryName) || 0) + 1);
      } else {
        scoreMap.set(score.countryName, score.score);
        countMap.set(score.countryName, 1);
      }
    }

    // Count by side using averaged scores
    let sideA = 0;
    let sideB = 0;
    let neutral = 0;

    for (const [countryName, total] of scoreMap) {
      const avg = total / (countMap.get(countryName) || 1);
      if (avg > 0.305) {
        sideA++;
      } else if (avg < -0.305) {
        sideB++;
      } else {
        neutral++;
      }
    }

    return { sideA, sideB, neutral };
  },
});

// Get issue details by ID
export const getIssueById = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.issueId);
  },
});

// Get issue by slug (for shareable URLs)
export const getIssueBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return issues[0] ?? null;
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

// Rate limiting config
const GENERATION_LIMIT = 3;
const RATE_LIMIT_WINDOW_MS = 16 * 60 * 60 * 1000; // 16 hours in milliseconds

// Get user's generation usage (sliding window rate limiting)
// Optimized: uses .take() to limit document reads instead of scanning all generations
export const getUserGenerationUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { count: 0, limit: GENERATION_LIMIT, remaining: GENERATION_LIMIT, nextAvailableAt: null };

    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Only fetch enough generations to check the limit (plus a few extra for filtering)
    // Using the new compound index for better performance
    const generations = await ctx.db
      .query("scenarioGenerations")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(GENERATION_LIMIT + 5); // Only need limit + buffer, not all historical data

    // Filter to those within the rate limit window
    const recentGenerations = generations.filter((g) => g.generatedAt >= windowStart);
    const count = recentGenerations.length;

    // Calculate when the next slot becomes available (if at limit)
    let nextAvailableAt: number | null = null;
    if (count >= GENERATION_LIMIT) {
      // Find the oldest generation in the window - that's when a slot opens up
      const oldestInWindow = recentGenerations
        .map((g) => g.generatedAt)
        .sort((a, b) => a - b)[0];
      nextAvailableAt = oldestInWindow + RATE_LIMIT_WINDOW_MS;
    }

    return {
      count,
      limit: GENERATION_LIMIT,
      remaining: Math.max(0, GENERATION_LIMIT - count),
      nextAvailableAt,
    };
  },
});

// Record a scenario generation (for rate limiting)
export const recordGeneration = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    await ctx.db.insert("scenarioGenerations", {
      userId,
      generatedAt: Date.now(),
    });
  },
});

// Clean up old generation records (older than rate limit window)
// Can be called periodically or as part of generation
export const cleanupOldGenerations = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;

    // Get old records using date index (avoids full table scan)
    const oldRecords = await ctx.db
      .query("scenarioGenerations")
      .withIndex("by_date", (q) => q.lt("generatedAt", cutoff))
      .take(500);

    // Delete them
    await Promise.all(oldRecords.map((record) => ctx.db.delete(record._id)));

    return { deleted: oldRecords.length };
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

// Get user's scenarios with pagination and search (authenticated)
export const getUserScenariosPaginated = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { scenarios: [], totalCount: 0, totalPages: 0 };

    // Fetch all user scenarios (ordered by most recent)
    let scenarios = await ctx.db
      .query("issues")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Apply search filter if provided
    if (args.searchTerm && args.searchTerm.trim()) {
      const search = args.searchTerm.toLowerCase().trim();
      scenarios = scenarios.filter(
        (s) =>
          s.title.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search) ||
          s.primaryActor?.toLowerCase().includes(search) ||
          s.sideA.label.toLowerCase().includes(search) ||
          s.sideB.label.toLowerCase().includes(search)
      );
    }

    const totalCount = scenarios.length;
    const totalPages = Math.ceil(totalCount / args.pageSize);

    // Apply pagination (page is 1-indexed)
    const startIndex = (args.page - 1) * args.pageSize;
    const paginatedScenarios = scenarios.slice(startIndex, startIndex + args.pageSize);

    return {
      scenarios: paginatedScenarios,
      totalCount,
      totalPages,
    };
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

// Insert batch scores (for real-time map updates)
// Always inserts new rows - the query handles averaging multiple entries per country
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
      await ctx.db.insert("countryScores", {
        issueId: args.issueId,
        countryName: newScore.countryName,
        score: Math.max(-1, Math.min(1, newScore.score)),
        reasoning: newScore.reasoning,
      });
    }

    return { insertedCount: args.scores.length };
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

// Feature an issue (auto-unfeatures oldest if 2 already featured)
export const featureIssue = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    // Get currently featured issues
    const featuredIssues = await ctx.db
      .query("issues")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
    const activeFeatured = featuredIssues.filter((i) => i.isActive && i._id !== args.issueId);

    // If already 2 featured, unfeature the oldest one
    if (activeFeatured.length >= 2) {
      // Sort by featuredAt ascending (oldest first)
      activeFeatured.sort((a, b) => (a.featuredAt ?? 0) - (b.featuredAt ?? 0));
      const oldest = activeFeatured[0];
      await ctx.db.patch(oldest._id, {
        isFeatured: false,
        featuredAt: undefined,
      });
    }

    // Feature the new issue
    await ctx.db.patch(args.issueId, {
      isFeatured: true,
      featuredAt: Date.now(),
      isActive: true, // Ensure it's active
    });

    return { success: true };
  },
});

// Unfeature an issue
export const unfeatureIssue = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await ctx.db.patch(args.issueId, {
      isFeatured: false,
      featuredAt: undefined,
    });

    return { success: true };
  },
});

// Archive an issue (also unfeatures if featured)
export const archiveIssue = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await ctx.db.patch(args.issueId, {
      isActive: false,
      isFeatured: false,
      featuredAt: undefined,
    });

    return { success: true };
  },
});

// Unarchive an issue (comes back as regular active, not featured)
export const unarchiveIssue = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await ctx.db.patch(args.issueId, {
      isActive: true,
    });

    return { success: true };
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
    totalCountries: v.optional(v.number()),
    completedCountries: v.optional(v.number()),
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
    if (args.totalCountries !== undefined) updateData.totalCountries = args.totalCountries;
    if (args.completedCountries !== undefined) updateData.completedCountries = args.completedCountries;
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
    totalCountries: v.number(),
    source: v.optional(v.union(v.literal("daily"), v.literal("custom"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check rate limit for custom scenarios (skip for daily/admin scenarios)
    const source = args.source ?? "custom";
    const authUserId = await getAuthUserId(ctx);

    if (source === "custom" && authUserId) {
      const now = Date.now();
      const windowStart = now - RATE_LIMIT_WINDOW_MS;

      // Get user's recent generations (only need limit + 1 to check)
      const generations = await ctx.db
        .query("scenarioGenerations")
        .withIndex("by_user_date", (q) => q.eq("userId", authUserId).gte("generatedAt", windowStart))
        .take(GENERATION_LIMIT + 1);

      const recentCount = generations.length;

      if (recentCount >= GENERATION_LIMIT) {
        throw new Error(`Rate limit reached. You can generate ${GENERATION_LIMIT} scenarios every 16 hours. Please try again later.`);
      }

      // Record this generation
      await ctx.db.insert("scenarioGenerations", {
        userId: authUserId,
        generatedAt: now,
      });
    }

    // Generate unique slug
    let slug = generateRandomSlug();
    // Check for collision (extremely unlikely with 8 alphanumeric chars)
    const existing = await ctx.db
      .query("issues")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      slug = generateRandomSlug();
    }

    // Create issue
    const issueId = await ctx.db.insert("issues", {
      title: args.title,
      slug,
      description: args.description,
      primaryActor: args.primaryActor,
      sideA: args.sideA,
      sideB: args.sideB,
      mapVersionId: args.mapVersionId,
      generatedAt: Date.now(),
      isActive: args.isActive ?? false,
      source: args.source ?? "custom",
      userId: args.userId,
    });

    // Create job
    const jobId = await ctx.db.insert("generationJobs", {
      issueId,
      status: "running",
      progress: 0,
      totalBatches: args.totalBatches,
      completedBatches: 0,
      totalCountries: args.totalCountries,
      completedCountries: 0,
      currentRun: 1,
      totalRuns: args.totalRuns,
      startedAt: Date.now(),
    });

    return { issueId, jobId, slug };
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

// Delete a scenario and all associated data (authenticated, owner or admin)
export const deleteScenario = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check if user is admin
    const user = await ctx.db.get(userId);
    const adminEmails = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map(e => e.trim()) || [];
    const isAdmin = user && "email" in user && user.email && adminEmails.includes((user.email as string).toLowerCase());

    // Get the issue and verify ownership or admin
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Scenario not found");
    }
    if (issue.userId !== userId && !isAdmin) {
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

// ============ IMAGE UPLOAD ============

// Generate a presigned URL for uploading an image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update an issue with an uploaded image
export const updateIssueImage = mutation({
  args: {
    issueId: v.id("issues"),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get the existing issue to check for old image
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    // Delete old image if it exists
    if (issue.imageId) {
      await ctx.storage.delete(issue.imageId);
    }

    // Update issue with new image
    await ctx.db.patch(args.issueId, { imageId: args.imageId });

    return { success: true };
  },
});

// Remove image from an issue
export const deleteIssueImage = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    if (issue.imageId) {
      await ctx.storage.delete(issue.imageId);
      await ctx.db.patch(args.issueId, { imageId: undefined });
    }

    return { success: true };
  },
});

// Get the URL for an issue's image
export const getIssueImageUrl = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue?.imageId) return null;

    return await ctx.storage.getUrl(issue.imageId);
  },
});

// ============ MIGRATION MUTATIONS ============

// Helper: Truncate text at last space or period before maxLength
function truncateReasoning(text: string | undefined, maxLength: number = 160): string | undefined {
  if (!text) return undefined;
  if (text.length <= maxLength) return text;

  // Find last space or period before maxLength
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastSpace = truncated.lastIndexOf(" ");

  // Prefer period if it's reasonably close to the end (within 40 chars)
  if (lastPeriod > maxLength - 40) {
    return text.slice(0, lastPeriod + 1);
  }
  // Otherwise use last space
  if (lastSpace > 0) {
    return text.slice(0, lastSpace) + "...";
  }
  // Fallback: hard truncate
  return truncated + "...";
}

// Migrate a single issue to use embedded scores
export const migrateIssueScores = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found");

    // Skip if already migrated
    if (issue.mapScores && issue.mapScores.length > 0) {
      return { skipped: true, message: "Already migrated" };
    }

    // Fetch all scores from countryScores table
    const rawScores = await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    if (rawScores.length === 0) {
      return { skipped: true, message: "No scores to migrate" };
    }

    // Aggregate by country (average if multiple, keep first reasoning)
    const scoreMap = new Map<string, { total: number; count: number; reasoning?: string }>();
    for (const score of rawScores) {
      const existing = scoreMap.get(score.countryName);
      if (existing) {
        existing.total += score.score;
        existing.count += 1;
      } else {
        scoreMap.set(score.countryName, {
          total: score.score,
          count: 1,
          reasoning: score.reasoning,
        });
      }
    }

    // Build mapScores array and calculate counts
    const mapScores: Array<{ c: string; s: number; r?: string }> = [];
    let sideA = 0;
    let sideB = 0;
    let neutral = 0;

    scoreMap.forEach((data, countryName) => {
      const avgScore = data.total / data.count;
      mapScores.push({
        c: countryName,
        s: avgScore,
        r: truncateReasoning(data.reasoning),
      });

      if (avgScore > 0.305) {
        sideA++;
      } else if (avgScore < -0.305) {
        sideB++;
      } else {
        neutral++;
      }
    });

    // Update issue with embedded scores
    await ctx.db.patch(args.issueId, {
      mapScores,
      scoreCounts: { a: sideA, b: sideB, n: neutral },
    });

    return {
      migrated: true,
      countriesCount: mapScores.length,
      scoreCounts: { sideA, sideB, neutral },
    };
  },
});

// Get all issues that need migration
export const getIssuesNeedingMigration = query({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db.query("issues").take(500);
    return issues
      .filter((i) => !i.mapScores || i.mapScores.length === 0)
      .map((i) => ({ _id: i._id, title: i.title }));
  },
});

// Get issues that need slug backfill
export const getIssuesNeedingSlugs = query({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db.query("issues").take(500);
    return issues
      .filter((i) => !i.slug)
      .map((i) => ({ _id: i._id, title: i.title }));
  },
});

// Backfill a slug for an existing issue
export const backfillSlug = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.slug) return;

    let slug = generateRandomSlug();
    const existing = await ctx.db
      .query("issues")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      slug = generateRandomSlug();
    }

    await ctx.db.patch(args.issueId, { slug });
    return slug;
  },
});

// Update embedded scores for an issue (called after score generation)
export const updateEmbeddedScores = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const rawScores = await ctx.db
      .query("countryScores")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Aggregate by country (keep first reasoning)
    const scoreMap = new Map<string, { total: number; count: number; reasoning?: string }>();
    for (const score of rawScores) {
      const existing = scoreMap.get(score.countryName);
      if (existing) {
        existing.total += score.score;
        existing.count += 1;
      } else {
        scoreMap.set(score.countryName, {
          total: score.score,
          count: 1,
          reasoning: score.reasoning,
        });
      }
    }

    // Build mapScores and counts
    const mapScores: Array<{ c: string; s: number; r?: string }> = [];
    let sideA = 0;
    let sideB = 0;
    let neutral = 0;

    scoreMap.forEach((data, countryName) => {
      const avgScore = data.total / data.count;
      mapScores.push({
        c: countryName,
        s: avgScore,
        r: truncateReasoning(data.reasoning),
      });

      if (avgScore > 0.305) {
        sideA++;
      } else if (avgScore < -0.305) {
        sideB++;
      } else {
        neutral++;
      }
    });

    await ctx.db.patch(args.issueId, {
      mapScores,
      scoreCounts: { a: sideA, b: sideB, n: neutral },
    });

    return { updated: true, countriesCount: mapScores.length };
  },
});
