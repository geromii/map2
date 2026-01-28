#!/usr/bin/env npx tsx
/**
 * Migration script for embedded scores
 *
 * Run with: npx tsx scripts/migrate-embedded-scores.ts
 *
 * This migrates existing headlines and issues to use embedded mapScores and scoreCounts
 * for bandwidth optimization (1 doc read vs 200+ doc reads).
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL not set in environment");
  console.error("Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

async function migrate() {
  const client = new ConvexHttpClient(CONVEX_URL as string);

  console.log("Starting embedded scores migration...\n");

  // Migrate headlines
  console.log("=== Migrating Headlines ===");
  try {
    const headlinesNeedingMigration = await client.query(
      api.headlines.getHeadlinesNeedingMigration,
      {}
    );

    if (headlinesNeedingMigration.length === 0) {
      console.log("No headlines need migration.\n");
    } else {
      console.log(`Found ${headlinesNeedingMigration.length} headlines to migrate.`);

      for (const headline of headlinesNeedingMigration) {
        try {
          const result = await client.mutation(api.headlines.migrateHeadlineScores, {
            headlineId: headline._id,
          });

          if (result.skipped) {
            console.log(`  ⏭ Skipped: ${headline.title} (${result.message})`);
          } else {
            console.log(
              `  ✓ Migrated: ${headline.title} (${result.countriesCount} countries)`
            );
          }
        } catch (error) {
          console.error(`  ✗ Error migrating headline "${headline.title}":`, error);
        }
      }
      console.log();
    }
  } catch (error) {
    console.error("Error fetching headlines:", error);
  }

  // Migrate issues
  console.log("=== Migrating Issues ===");
  try {
    const issuesNeedingMigration = await client.query(
      api.issues.getIssuesNeedingMigration,
      {}
    );

    if (issuesNeedingMigration.length === 0) {
      console.log("No issues need migration.\n");
    } else {
      console.log(`Found ${issuesNeedingMigration.length} issues to migrate.`);

      for (const issue of issuesNeedingMigration) {
        try {
          const result = await client.mutation(api.issues.migrateIssueScores, {
            issueId: issue._id,
          });

          if (result.skipped) {
            console.log(`  ⏭ Skipped: ${issue.title} (${result.message})`);
          } else {
            console.log(
              `  ✓ Migrated: ${issue.title} (${result.countriesCount} countries)`
            );
          }
        } catch (error) {
          console.error(`  ✗ Error migrating issue "${issue.title}":`, error);
        }
      }
      console.log();
    }
  } catch (error) {
    console.error("Error fetching issues:", error);
  }

  console.log("Migration complete!");
}

migrate();
