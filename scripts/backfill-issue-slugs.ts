#!/usr/bin/env npx tsx
/**
 * Backfill slugs for existing issues that don't have one.
 *
 * Usage: npx tsx scripts/backfill-issue-slugs.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issues = await (client as any).query(api.issues.getIssuesNeedingSlugs);
  console.log(`Found ${issues.length} issues without slugs`);

  for (const issue of issues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).mutation(api.issues.backfillSlug, { issueId: issue._id });
    console.log(`  Assigned slug to: ${issue.title}`);
  }

  console.log("Done!");
}

main().catch(console.error);
