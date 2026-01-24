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

  // Issues (both daily headlines and custom prompts)
  issues: defineTable({
    title: v.string(),
    description: v.string(),
    primaryActor: v.optional(v.string()), // Entity that "wins" if scenario happens (e.g., "South Korea", "Quebec Separatists")
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"), // Links to map version used for generation
    generatedAt: v.number(),
    isActive: v.boolean(),
    source: v.union(v.literal("daily"), v.literal("custom")),
    userId: v.optional(v.string()), // User who created the issue (for custom scenarios)
  }).index("by_active", ["isActive"]).index("by_user", ["userId"]),

  // Country scores per issue
  countryScores: defineTable({
    issueId: v.id("issues"),
    countryName: v.string(),
    score: v.float64(), // -1 to 1
    reasoning: v.optional(v.string()),
  }).index("by_issue", ["issueId"]),

  // Custom prompts (authenticated users)
  customPrompts: defineTable({
    userId: v.string(),
    prompt: v.string(),
    issueId: v.optional(v.id("issues")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    error: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Job tracking
  generationJobs: defineTable({
    issueId: v.id("issues"),
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
  }).index("by_status", ["status"]).index("by_issue", ["issueId"]),

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
