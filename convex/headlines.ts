import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============ QUERIES ============

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

// Get active headlines (public, non-featured)
export const getActiveHeadlines = query({
  args: {},
  handler: async (ctx) => {
    const headlines = await ctx.db
      .query("headlines")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return headlines.filter((h) => !h.isFeatured);
  },
});

// Get featured headlines
export const getFeaturedHeadlines = query({
  args: {},
  handler: async (ctx) => {
    const headlines = await ctx.db
      .query("headlines")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
    return headlines
      .filter((h) => h.isActive)
      .sort((a, b) => (b.featuredAt ?? 0) - (a.featuredAt ?? 0));
  },
});

// Get archived headlines
export const getArchivedHeadlines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("headlines")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .collect();
  },
});

// Get all headlines (admin)
export const getAllHeadlines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("headlines").collect();
  },
});

// Get headline by ID
export const getHeadlineById = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.headlineId);
  },
});

// Get headline by slug (for /headlines/[slug] routes)
export const getHeadlineBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const headlines = await ctx.db
      .query("headlines")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return headlines[0] ?? null;
  },
});

// Get scores for a headline (aggregated by country)
export const getHeadlineScores = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const rawScores = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
      .collect();

    // Aggregate by country (average if multiple)
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

    const result: Array<{ countryName: string; score: number; reasoning?: string }> = [];
    scoreMap.forEach((data, countryName) => {
      result.push({
        countryName,
        score: data.total / data.count,
        reasoning: data.reasoning,
      });
    });

    return result;
  },
});

// Get country counts by side (for headline cards)
export const getHeadlineCounts = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const rawScores = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
      .collect();

    // Aggregate by country
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

    let sideA = 0;
    let sideB = 0;
    let neutral = 0;

    scoreMap.forEach((total, countryName) => {
      const avg = total / (countMap.get(countryName) || 1);
      if (avg > 0.305) {
        sideA++;
      } else if (avg < -0.305) {
        sideB++;
      } else {
        neutral++;
      }
    });

    return { sideA, sideB, neutral };
  },
});

// Get job status for a headline
export const getJobStatus = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generationJobs")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
      .order("desc")
      .first();
  },
});

// Get image URL for a headline
export const getHeadlineImageUrl = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const headline = await ctx.db.get(args.headlineId);
    if (!headline?.imageId) return null;
    return await ctx.storage.getUrl(headline.imageId);
  },
});

// Get active map version
export const getActiveMapVersion = query({
  args: {},
  handler: async (ctx) => {
    const versions = await ctx.db
      .query("mapVersions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return versions[0] ?? null;
  },
});

// ============ MUTATIONS ============

// Create a new headline
export const createHeadline = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("headlines", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      primaryActor: args.primaryActor,
      sideA: args.sideA,
      sideB: args.sideB,
      mapVersionId: args.mapVersionId,
      generatedAt: Date.now(),
      isActive: args.isActive ?? false,
    });
  },
});

// Initialize headline with job (for real-time generation)
export const initializeHeadline = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"),
    totalBatches: v.number(),
    totalRuns: v.number(),
    totalCountries: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const headlineId = await ctx.db.insert("headlines", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      primaryActor: args.primaryActor,
      sideA: args.sideA,
      sideB: args.sideB,
      mapVersionId: args.mapVersionId,
      generatedAt: Date.now(),
      isActive: args.isActive ?? false,
    });

    const jobId = await ctx.db.insert("generationJobs", {
      headlineId,
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

    return { headlineId, jobId };
  },
});

// Save scores for a headline (replaces existing)
export const saveHeadlineScores = mutation({
  args: {
    headlineId: v.id("headlines"),
    scores: v.array(
      v.object({
        countryName: v.string(),
        score: v.float64(),
        reasoning: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing scores
    const existing = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
      .collect();

    for (const score of existing) {
      await ctx.db.delete(score._id);
    }

    // Insert new scores
    for (const score of args.scores) {
      await ctx.db.insert("headlineScores", {
        headlineId: args.headlineId,
        countryName: score.countryName,
        score: Math.max(-1, Math.min(1, score.score)),
        reasoning: score.reasoning,
      });
    }

    return { savedCount: args.scores.length };
  },
});

// Upsert batch scores (for streaming updates)
export const upsertBatchScores = mutation({
  args: {
    headlineId: v.id("headlines"),
    scores: v.array(
      v.object({
        countryName: v.string(),
        score: v.float64(),
        reasoning: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const score of args.scores) {
      await ctx.db.insert("headlineScores", {
        headlineId: args.headlineId,
        countryName: score.countryName,
        score: Math.max(-1, Math.min(1, score.score)),
        reasoning: score.reasoning,
      });
    }
    return { insertedCount: args.scores.length };
  },
});

// Update headline slug
export const updateHeadlineSlug = mutation({
  args: {
    headlineId: v.id("headlines"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Check uniqueness
    const existing = await ctx.db
      .query("headlines")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing && existing._id !== args.headlineId) {
      throw new Error("Slug already in use");
    }

    await ctx.db.patch(args.headlineId, { slug: args.slug });
  },
});

// Feature a headline
export const featureHeadline = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const headline = await ctx.db.get(args.headlineId);
    if (!headline) throw new Error("Headline not found");

    // Get currently featured
    const featured = await ctx.db
      .query("headlines")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
    const activeFeatured = featured.filter((h) => h.isActive && h._id !== args.headlineId);

    // Unfeature oldest if 2+ already featured
    if (activeFeatured.length >= 2) {
      activeFeatured.sort((a, b) => (a.featuredAt ?? 0) - (b.featuredAt ?? 0));
      await ctx.db.patch(activeFeatured[0]._id, {
        isFeatured: false,
        featuredAt: undefined,
      });
    }

    await ctx.db.patch(args.headlineId, {
      isFeatured: true,
      featuredAt: Date.now(),
      isActive: true,
    });

    return { success: true };
  },
});

// Unfeature a headline
export const unfeatureHeadline = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.headlineId, {
      isFeatured: false,
      featuredAt: undefined,
    });
    return { success: true };
  },
});

// Archive a headline
export const archiveHeadline = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.headlineId, {
      isActive: false,
      isFeatured: false,
      featuredAt: undefined,
    });
    return { success: true };
  },
});

// Unarchive a headline
export const unarchiveHeadline = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.headlineId, { isActive: true });
    return { success: true };
  },
});

// Update headline image
export const updateHeadlineImage = mutation({
  args: {
    headlineId: v.id("headlines"),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const headline = await ctx.db.get(args.headlineId);
    if (!headline) throw new Error("Headline not found");

    // Delete old image
    if (headline.imageId) {
      await ctx.storage.delete(headline.imageId);
    }

    await ctx.db.patch(args.headlineId, { imageId: args.imageId });
    return { success: true };
  },
});

// Delete headline image
export const deleteHeadlineImage = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const headline = await ctx.db.get(args.headlineId);
    if (!headline) throw new Error("Headline not found");

    if (headline.imageId) {
      await ctx.storage.delete(headline.imageId);
      await ctx.db.patch(args.headlineId, { imageId: undefined });
    }
    return { success: true };
  },
});

// Generate upload URL (reuse from issues or add here)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
