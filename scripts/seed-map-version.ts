#!/usr/bin/env npx tsx
/**
 * Seed script for map version data
 *
 * Run with: npx tsx scripts/seed-map-version.ts
 *
 * This creates the initial mapVersion entry needed for the AI scenario generator.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import countries from "../src/app/countries.json";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL not set in environment");
  console.error("Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

async function seed() {
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("Seeding map version data...");
  console.log(`Countries: ${countries.length}`);

  try {
    const mapVersionId = await client.mutation(api.issues.createMapVersion, {
      version: "2025-01",
      topojsonFile: "features.json",
      countriesFile: "countries.json",
      countryCount: countries.length,
      countries: countries,
      isActive: true,
    });

    console.log("✓ Map version created successfully!");
    console.log(`  ID: ${mapVersionId}`);
    console.log(`  Countries: ${countries.length}`);
    console.log(`  Active: true`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log("Map version already exists, skipping...");
    } else {
      console.error("Error seeding map version:", error);
      process.exit(1);
    }
  }
}

seed();
