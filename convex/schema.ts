import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Map data versions (topojson + country list)
  mapVersions: defineTable({
    version: v.string(), // e.g., "2025-01"
    topojsonFile: v.string(), // e.g., "features_2025_01.json"
    countriesFile: v.string(), // e.g., "countries_2025_01.json"
    countryCount: v.number(), // e.g., 201
    countries: v.array(v.string()), // Full list for validation
    createdAt: v.number(),
    isActive: v.boolean(), // Current version for new issues
  }).index("by_active", ["isActive"]),

  // ============================================
  // HEADLINES (editorial content for /headlines)
  // ============================================
  headlines: defineTable({
    title: v.string(),
    slug: v.optional(v.string()), // URL-friendly identifier, e.g., "us-china-tariffs-2026"
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"),
    generatedAt: v.number(),
    isActive: v.boolean(), // false = archived
    imageId: v.optional(v.id("_storage")),
    isFeatured: v.optional(v.boolean()),
    featuredAt: v.optional(v.number()),
  })
    .index("by_active", ["isActive"])
    .index("by_slug", ["slug"])
    .index("by_featured", ["isFeatured"]),

  // Country scores per headline
  headlineScores: defineTable({
    headlineId: v.id("headlines"),
    countryName: v.string(),
    score: v.float64(), // -1 to 1
    reasoning: v.optional(v.string()),
  }).index("by_headline", ["headlineId"]),

  // Draft headlines (auto-saved parsed prompts for admin recovery)
  draftHeadlines: defineTable({
    title: v.string(),
    description: v.string(),
    primaryActor: v.optional(v.string()),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    originalPrompt: v.optional(v.string()), // The prompt that was parsed
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // ============================================
  // ISSUES (user-generated custom scenarios)
  // ============================================

  // Issues (both daily headlines and custom prompts)
  issues: defineTable({
    title: v.string(),
    description: v.string(),
    primaryActor: v.optional(v.string()), // Entity that "wins" if scenario happens (e.g., "South Korea", "Quebec Separatists")
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"), // Links to map version used for generation
    generatedAt: v.number(),
    isActive: v.boolean(), // false = archived
    source: v.union(v.literal("daily"), v.literal("custom")),
    userId: v.optional(v.string()), // User who created the issue (for custom scenarios)
    imageId: v.optional(v.id("_storage")), // Optional headline image (16:9 aspect ratio)
    isFeatured: v.optional(v.boolean()), // true for top 2 featured headlines
    featuredAt: v.optional(v.number()), // timestamp when featured, used for auto-unfeature
  }).index("by_active", ["isActive"]).index("by_user", ["userId"]).index("by_featured", ["isFeatured"]),

  // Country scores per issue
  countryScores: defineTable({
    issueId: v.id("issues"),
    countryName: v.string(),
    score: v.float64(), // -1 to 1
    reasoning: v.optional(v.string()),
  }).index("by_issue", ["issueId"]),

  // Job tracking (for both headlines and issues)
  generationJobs: defineTable({
    headlineId: v.optional(v.id("headlines")), // For editorial headlines
    issueId: v.optional(v.id("issues")), // For custom scenarios
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()), // 0-100 percentage
    totalBatches: v.optional(v.number()),
    completedBatches: v.optional(v.number()),
    totalCountries: v.optional(v.number()), // Total countries to score (e.g., 201)
    completedCountries: v.optional(v.number()), // Countries scored so far
    currentRun: v.optional(v.number()), // Which averaging run we're on
    totalRuns: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_issue", ["issueId"])
    .index("by_headline", ["headlineId"]),

  // AI request logs (for debugging)
  aiLogs: defineTable({
    timestamp: v.number(),
    action: v.string(), // e.g., "parsePromptToSides", "generateBatchScores"
    model: v.string(),
    provider: v.optional(v.string()), // e.g., "google-ai-studio", "openrouter"
    systemPrompt: v.string(),
    userPrompt: v.string(),
    requestBody: v.string(), // Full JSON stringified request
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  }).index("by_timestamp", ["timestamp"]),
});

export default schema;
