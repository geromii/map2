#!/usr/bin/env npx tsx
/**
 * Edit relationship score between two countries
 *
 * Run with: npx tsx scripts/edit-relationship-score.ts "Country A" "Country B" 0.5
 *
 * Arguments:
 *   - Country A: First country name (must match exactly)
 *   - Country B: Second country name (must match exactly)
 *   - Score: New score value between -1 and 1
 *
 * The script updates both directions (A→B and B→A) to maintain matrix symmetry.
 *
 * Examples:
 *   npx tsx scripts/edit-relationship-score.ts "United States" "Russia" -0.8
 *   npx tsx scripts/edit-relationship-score.ts "France" "Germany" 0.9
 *
 * To view current score without changing:
 *   npx tsx scripts/edit-relationship-score.ts "United States" "Russia"
 */

import * as fs from "fs";
import * as path from "path";
import countries from "../src/app/countries.json";

const MATRIX_FILE = path.join(__dirname, "../public/map_design_2025_08.json");

function findCountryIndex(countryName: string): number {
  const index = countries.indexOf(countryName);
  if (index === -1) {
    console.error(`\nError: Country "${countryName}" not found.`);
    console.error("\nDid you mean one of these?");
    const suggestions = countries.filter((c) =>
      c.toLowerCase().includes(countryName.toLowerCase())
    );
    if (suggestions.length > 0) {
      suggestions.slice(0, 5).forEach((s) => console.error(`  - ${s}`));
    } else {
      console.error("  (No similar names found)");
    }
    process.exit(1);
  }
  return index;
}

function loadMatrix(): number[][] {
  const content = fs.readFileSync(MATRIX_FILE, "utf-8");
  return JSON.parse(content);
}

function saveMatrix(matrix: number[][]): void {
  // Save with compact formatting (one row per line for readability)
  const rows = matrix.map((row) => "[" + row.join(",") + "]");
  const content = "[" + rows.join(",\n") + "]\n";
  fs.writeFileSync(MATRIX_FILE, content, "utf-8");
}

function formatScore(score: number): string {
  return score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npx tsx scripts/edit-relationship-score.ts <country1> <country2> [score]");
    console.log("");
    console.log("Arguments:");
    console.log("  country1  First country name (exact match required)");
    console.log("  country2  Second country name (exact match required)");
    console.log("  score     New score between -1 and 1 (optional - omit to view current)");
    console.log("");
    console.log("Examples:");
    console.log('  npx tsx scripts/edit-relationship-score.ts "United States" "Russia" -0.8');
    console.log('  npx tsx scripts/edit-relationship-score.ts "France" "Germany"  # view only');
    console.log("");
    console.log("Available countries:");
    countries.forEach((c, i) => console.log(`  [${i.toString().padStart(3)}] ${c}`));
    process.exit(0);
  }

  const countryA = args[0];
  const countryB = args[1];
  const newScore = args[2] ? parseFloat(args[2]) : undefined;

  // Validate score if provided
  if (newScore !== undefined) {
    if (isNaN(newScore)) {
      console.error(`Error: Invalid score "${args[2]}". Must be a number.`);
      process.exit(1);
    }
    if (newScore < -1 || newScore > 1) {
      console.error(`Error: Score ${newScore} is out of range. Must be between -1 and 1.`);
      process.exit(1);
    }
  }

  // Find country indices
  const indexA = findCountryIndex(countryA);
  const indexB = findCountryIndex(countryB);

  if (indexA === indexB) {
    console.error("Error: Cannot set relationship score between a country and itself.");
    process.exit(1);
  }

  // Load matrix
  console.log(`\nLoading matrix from ${path.basename(MATRIX_FILE)}...`);
  const matrix = loadMatrix();

  // Verify matrix dimensions
  if (matrix.length !== countries.length) {
    console.error(`Error: Matrix has ${matrix.length} rows but expected ${countries.length}`);
    process.exit(1);
  }

  // Get current scores
  const currentScoreAB = matrix[indexA][indexB];
  const currentScoreBA = matrix[indexB][indexA];

  console.log(`\nRelationship: ${countryA} ↔ ${countryB}`);
  console.log(`Indices: [${indexA}][${indexB}] and [${indexB}][${indexA}]`);
  console.log(`\nCurrent scores:`);
  console.log(`  ${countryA} → ${countryB}: ${formatScore(currentScoreAB)}`);
  console.log(`  ${countryB} → ${countryA}: ${formatScore(currentScoreBA)}`);

  if (currentScoreAB !== currentScoreBA) {
    console.log(`\n⚠️  Warning: Asymmetric scores detected!`);
  }

  // If no new score provided, just display and exit
  if (newScore === undefined) {
    console.log(`\nNo new score provided. Use a third argument to update.`);
    process.exit(0);
  }

  // Update both directions
  console.log(`\nUpdating to: ${formatScore(newScore)}`);
  matrix[indexA][indexB] = newScore;
  matrix[indexB][indexA] = newScore;

  // Save
  saveMatrix(matrix);
  console.log(`\n✓ Matrix updated successfully!`);
  console.log(`  ${countryA} → ${countryB}: ${formatScore(currentScoreAB)} → ${formatScore(newScore)}`);
  console.log(`  ${countryB} → ${countryA}: ${formatScore(currentScoreBA)} → ${formatScore(newScore)}`);
  console.log(`\nNote: Clear your browser cache/sessionStorage to see changes in the app.`);
}

main();
