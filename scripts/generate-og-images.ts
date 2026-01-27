import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

// Import countries list
const countries: string[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/app/countries.json"), "utf-8")
);

// Convert country name to URL-friendly slug (matches countrySlug.ts)
function countryToSlug(country: string): string {
  return country
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "../public/og/diplomacy");

async function generateOGImages() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating OG images for ${countries.length} countries...`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 1,
  });

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const slug = countryToSlug(country);
    const url = `${BASE_URL}/diplomacy/${slug}`;
    const outputPath = path.join(OUTPUT_DIR, `${slug}.jpg`);

    try {
      const page = await context.newPage();

      // Navigate to the page
      await page.goto(url, { waitUntil: "networkidle" });

      // Wait for the map to load (loading indicator disappears)
      // The loading text contains "Loading map..."
      await page.waitForFunction(
        () => {
          const svg = document.querySelector("svg");
          const loadingText = document.body.innerText;
          return svg && !loadingText.includes("Loading map...");
        },
        { timeout: 15000 }
      );

      // Give a small buffer for any final rendering
      await page.waitForTimeout(300);

      // Find just the map div (without the header)
      const mapElement = await page.locator(".map-container > div:last-child").first();

      await mapElement.screenshot({
        path: outputPath,
        type: "jpeg",
        quality: 85,
      });

      await page.close();

      successCount++;
      console.log(`[${i + 1}/${countries.length}] ✓ ${country}`);
    } catch (error) {
      errorCount++;
      console.error(`[${i + 1}/${countries.length}] ✗ ${country}: ${error}`);
    }
  }

  await browser.close();

  console.log(`\nDone! Generated ${successCount} images, ${errorCount} errors.`);

  // Calculate approximate total size
  let totalSize = 0;
  const files = fs.readdirSync(OUTPUT_DIR);
  for (const file of files) {
    const stats = fs.statSync(path.join(OUTPUT_DIR, file));
    totalSize += stats.size;
  }
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

generateOGImages().catch(console.error);
