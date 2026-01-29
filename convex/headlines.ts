import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============ QUERIES ============

// Helper: compute counts from headlineScores table (fallback for unmigrated data)
async function computeCountsFromScores(
  ctx: { db: any },
  headlineId: any
): Promise<{ sideA: number; sideB: number; neutral: number }> {
  const rawScores = await ctx.db
    .query("headlineScores")
    .withIndex("by_headline", (q: any) => q.eq("headlineId", headlineId))
    .collect();

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
    if (avg > 0.305) sideA++;
    else if (avg < -0.305) sideB++;
    else neutral++;
  });

  return { sideA, sideB, neutral };
}

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
      .take(200);
    const filtered = headlines.filter((h) => !h.isFeatured);
    // Return image URLs and counts inline to avoid cascading client queries
    return Promise.all(
      filtered.map(async (h) => ({
        ...h,
        imageUrl: h.imageId ? await ctx.storage.getUrl(h.imageId) : null,
        counts: h.scoreCounts
          ? { sideA: h.scoreCounts.a, sideB: h.scoreCounts.b, neutral: h.scoreCounts.n }
          : await computeCountsFromScores(ctx, h._id),
      }))
    );
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
    const sorted = headlines
      .filter((h) => h.isActive)
      .sort((a, b) => (b.featuredAt ?? 0) - (a.featuredAt ?? 0));
    // Return image URLs and counts inline to avoid cascading client queries
    return Promise.all(
      sorted.map(async (h) => ({
        ...h,
        imageUrl: h.imageId ? await ctx.storage.getUrl(h.imageId) : null,
        counts: h.scoreCounts
          ? { sideA: h.scoreCounts.a, sideB: h.scoreCounts.b, neutral: h.scoreCounts.n }
          : await computeCountsFromScores(ctx, h._id),
      }))
    );
  },
});

// Get archived headlines
export const getArchivedHeadlines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("headlines")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .take(500);
  },
});

// Get all headlines (admin)
export const getAllHeadlines = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("headlines").take(500);
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

// Get scores for map display (with reasoning preview for hover)
// Uses embedded mapScores if available (1 doc read), falls back to table query (200+ doc reads)
export const getHeadlineScoresForMap = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    // Try to use embedded scores first (bandwidth optimized)
    const headline = await ctx.db.get(args.headlineId);
    if (headline?.mapScores && headline.mapScores.length > 0) {
      // Convert from compact format { c, s, r } to { countryName, score, reasoning }
      return headline.mapScores.map((s) => ({
        countryName: s.c,
        score: s.s,
        reasoning: s.r, // Truncated preview for hover
      }));
    }

    // Fallback: query headlineScores table (for unmigrated data)
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

// Get full reasoning for a single country (on-demand when user clicks for detail)
export const getCountryFullReasoning = query({
  args: {
    headlineId: v.id("headlines"),
    countryName: v.string(),
  },
  handler: async (ctx, args) => {
    const score = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline_country", (q) =>
        q.eq("headlineId", args.headlineId).eq("countryName", args.countryName)
      )
      .first();

    return score?.reasoning ?? null;
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
// Uses embedded scoreCounts if available (already loaded with headline), falls back to table query
export const getHeadlineCounts = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    // Try to use embedded counts first (bandwidth optimized - headline already loaded)
    const headline = await ctx.db.get(args.headlineId);
    if (headline?.scoreCounts) {
      return {
        sideA: headline.scoreCounts.a,
        sideB: headline.scoreCounts.b,
        neutral: headline.scoreCounts.n,
      };
    }

    // Fallback: query headlineScores table (for unmigrated data)
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

// Get recent AI logs (admin only)
export const getRecentAiLogs = query({
  args: {
    limit: v.optional(v.number()),
    sinceTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin status
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || !("email" in user) || !user.email) return [];

    const adminEmails = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map(e => e.trim()) || [];
    if (!adminEmails.includes((user.email as string).toLowerCase())) return [];

    // Fetch logs
    const limit = args.limit ?? 20;
    let logs = await ctx.db
      .query("aiLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(100); // Get more than needed, then filter

    // Filter by timestamp if provided
    if (args.sinceTimestamp) {
      logs = logs.filter(log => log.timestamp >= args.sinceTimestamp!);
    }

    return logs.slice(0, limit);
  },
});

// Get recent draft headlines (admin only)
export const getRecentDrafts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || !("email" in user) || !user.email) return [];

    const adminEmails = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map(e => e.trim()) || [];
    if (!adminEmails.includes((user.email as string).toLowerCase())) return [];

    const limit = args.limit ?? 10;
    return await ctx.db
      .query("draftHeadlines")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

// Save a draft headline (admin only)
export const saveDraft = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    originalPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || !("email" in user) || !user.email) throw new Error("User not found");

    const adminEmails = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map(e => e.trim()) || [];
    if (!adminEmails.includes((user.email as string).toLowerCase())) {
      throw new Error("Not authorized");
    }

    // Delete old drafts (keep only last 20)
    // Count by fetching 21 newest — if we get 21, delete the oldest ones
    const newestDrafts = await ctx.db
      .query("draftHeadlines")
      .withIndex("by_created")
      .order("desc")
      .take(21);

    if (newestDrafts.length >= 20) {
      // Fetch oldest drafts to delete (everything beyond the 19 we want to keep)
      const oldDrafts = await ctx.db
        .query("draftHeadlines")
        .withIndex("by_created")
        .order("asc")
        .take(newestDrafts.length - 19);
      await Promise.all(oldDrafts.map((draft) => ctx.db.delete(draft._id)));
    }

    return await ctx.db.insert("draftHeadlines", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      primaryActor: args.primaryActor,
      sideA: args.sideA,
      sideB: args.sideB,
      originalPrompt: args.originalPrompt,
      createdAt: Date.now(),
    });
  },
});

// Get missing countries for a headline (countries in mapVersion but not in headlineScores)
export const getMissingCountries = query({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const headline = await ctx.db.get(args.headlineId);
    if (!headline) return { missing: [], total: 0 };

    const mapVersion = await ctx.db.get(headline.mapVersionId);
    if (!mapVersion) return { missing: [], total: 0 };

    const allCountries = new Set(mapVersion.countries);

    // Get countries that have scores
    const scores = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
      .collect();

    const countriesWithScores = new Set(scores.map(s => s.countryName));

    // Find missing countries
    const missing = [...allCountries].filter(c => !countriesWithScores.has(c));

    return {
      missing,
      total: allCountries.size,
      scored: countriesWithScores.size,
    };
  },
});

// Delete a draft headline (admin only)
export const deleteDraft = mutation({
  args: { draftId: v.id("draftHeadlines") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || !("email" in user) || !user.email) throw new Error("User not found");

    const adminEmails = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map(e => e.trim()) || [];
    if (!adminEmails.includes((user.email as string).toLowerCase())) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.draftId);
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
    // Handle slug collision by appending a number
    let finalSlug = args.slug;
    if (finalSlug) {
      const baseSlug = finalSlug;
      const existing = await ctx.db
        .query("headlines")
        .withIndex("by_slug", (q) => q.eq("slug", finalSlug))
        .first();

      if (existing) {
        // Find a unique slug by appending numbers
        let counter = 2;
        while (true) {
          const candidateSlug = `${baseSlug}-${counter}`;
          const collision = await ctx.db
            .query("headlines")
            .withIndex("by_slug", (q) => q.eq("slug", candidateSlug))
            .first();
          if (!collision) {
            finalSlug = candidateSlug;
            break;
          }
          counter++;
        }
      }
    }

    const headlineId = await ctx.db.insert("headlines", {
      title: args.title,
      slug: finalSlug,
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

    await Promise.all(existing.map((score) => ctx.db.delete(score._id)));

    // Insert new scores
    await Promise.all(
      args.scores.map((score) =>
        ctx.db.insert("headlineScores", {
          headlineId: args.headlineId,
          countryName: score.countryName,
          score: Math.max(-1, Math.min(1, score.score)),
          reasoning: score.reasoning,
        })
      )
    );

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
    await Promise.all(
      args.scores.map((score) =>
        ctx.db.insert("headlineScores", {
          headlineId: args.headlineId,
          countryName: score.countryName,
          score: Math.max(-1, Math.min(1, score.score)),
          reasoning: score.reasoning,
        })
      )
    );
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
export const activateHeadline = mutation({
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

// ============ MIGRATION MUTATIONS ============

// Helper: Truncate text at last space or period before maxLength
// Always adds ellipsis to indicate there's more content available
function truncateReasoning(text: string | undefined, maxLength: number = 160): string | undefined {
  if (!text) return undefined;
  // Always add ellipsis even if text fits - indicates full reasoning is available on click
  if (text.length <= maxLength) return text + "...";

  // Find last space or period before maxLength
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastSpace = truncated.lastIndexOf(" ");

  // Prefer period if it's reasonably close to the end (within 40 chars)
  if (lastPeriod > maxLength - 40) {
    return text.slice(0, lastPeriod + 1) + "..";
  }
  // Otherwise use last space
  if (lastSpace > 0) {
    return text.slice(0, lastSpace) + "...";
  }
  // Fallback: hard truncate
  return truncated + "...";
}

// Migrate a single headline to use embedded scores
export const migrateHeadlineScores = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const headline = await ctx.db.get(args.headlineId);
    if (!headline) throw new Error("Headline not found");

    // Skip if already migrated
    if (headline.mapScores && headline.mapScores.length > 0) {
      return { skipped: true, message: "Already migrated" };
    }

    // Fetch all scores from headlineScores table
    const rawScores = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
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

    // Update headline with embedded scores
    await ctx.db.patch(args.headlineId, {
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

// Get all headlines that need migration
export const getHeadlinesNeedingMigration = query({
  args: {},
  handler: async (ctx) => {
    const headlines = await ctx.db.query("headlines").take(500);
    return headlines
      .filter((h) => !h.mapScores || h.mapScores.length === 0)
      .map((h) => ({ _id: h._id, title: h.title }));
  },
});

// Update embedded scores for a headline (called after score generation)
export const updateEmbeddedScores = mutation({
  args: { headlineId: v.id("headlines") },
  handler: async (ctx, args) => {
    const rawScores = await ctx.db
      .query("headlineScores")
      .withIndex("by_headline", (q) => q.eq("headlineId", args.headlineId))
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

    await ctx.db.patch(args.headlineId, {
      mapScores,
      scoreCounts: { a: sideA, b: sideB, n: neutral },
    });

    return { updated: true, countriesCount: mapScores.length };
  },
});
