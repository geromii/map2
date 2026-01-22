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
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    mapVersionId: v.id("mapVersions"), // Links to map version used for generation
    generatedAt: v.number(),
    isActive: v.boolean(),
    source: v.union(v.literal("daily"), v.literal("custom")),
  }).index("by_active", ["isActive"]),

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
    progress: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});

export default schema;
