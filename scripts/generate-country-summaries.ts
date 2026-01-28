import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Load countries and add Vatican City
const countries: string[] = [
  ...JSON.parse(fs.readFileSync(path.join(__dirname, "../src/app/countries.json"), "utf-8")),
  "Vatican City",
];

const OUTPUT_DIR = path.join(__dirname, "../src/data/country-summaries");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "summaries.json");

// Model selection via OpenRouter
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-3-pro-preview";

// Batch config - process 5 countries in ONE prompt
const BATCH_SIZE = 1;
const DELAY_BETWEEN_BATCHES_MS = 2000;

// Retry config
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

interface CountrySummary {
  country: string;
  summary: string;
  keyInterests: string[];
  alignments: string;
  generatedAt: string;
}

const SYSTEM_PROMPT = `You are a knowledgeable geopolitical analyst writing brief country profiles for a general audience.

You will be given a list of countries. For EACH country in the list, write a concise summary (150-200 words) of that country's global relations and geopolitical position. You must return data for ALL countries provided.

WRITING STYLE - THIS IS CRITICAL:
- Write at a journalistic New York Times reading level. BE ENGAGING, and write like a human, not an AI.
- Write for a general audience who are interested in global affairs. You are giving an introduction and primer on that country's geopolitics, and perhaps covering interesting and important things that an educated person might not know.
- Focus on facts, specific events, and specific relationships. Avoid abstract jargon.
- If there are competing ideologies within the country, talk about their respective perspectives on the world.
- Vary your sentence structure. Mix short punchy sentences with longer explanatory ones.
- VARY YOUR WORDING between countries. Don't reuse the same phrases, sentence starters, or structures. Each profile should feel distinct.
- NEVER use these overused words/phrases: "robust", "multifaceted", "significant", "notable", "plays a key role", "maintains strong ties", "strategic partnership", "geopolitical landscape", "landscape", "shifting"
- Don't start with "[Country] is..." - find more interesting openings, and vary them between countries
- Include specific details when possible (treaty names, organizations, historical events)
- Have a point of view - what makes this country's position interesting or unique?
- If referencing specific individuals, use their title (e.g. President Putin)
- Do not use capital cities to reference countries, instead use the name of that country (!!!)
- Avoid using embdashes
- Talk about recent developments. What has changed over the last few years? Or maybe, what endures, and what is surprising? Focus on the interesting. 
- Do not start your summary with "While"

CONTENT TO COVER FOR EACH:
1. What are this country's top 2-3 geopolitical priorities? (security, trade, regional influence, etc.)
2. Who are their key allies and why?
3. Any notable tensions or rivalries?
4. What makes their position unique or interesting?

Return a JSON object with country names as keys:
{
  "CountryName1": {
    "summary": "150-200 word summary...",
    "keyInterests": ["Interest one here", "Interest two here", "Interest three here"],
    "alignments": "Punchy, intriguing summary (around 25 words)."
  },
  "CountryName2": {
    "summary": "...",
    "keyInterests": ["...", "...", "..."],
    "alignments": "..."
  }
}

IMPORTANT:
- Each keyInterest should be around 4-6 words. If a specific country matters significantly, mention them.
- For alignments: Be punchy and slightly intriguing while retaining a professional tone (around 25 words). Write at a grade 10 level. Be objective. What we want is a readable, quick to understand summary that we can display as a standalone introduction. It should be understandable, and not confusing, for general educated audiences on its own. It's fine to introduce new concepts the reader may not be familiar with, but properly introduce them, not just a drive-by two words. Focus on readability and the most important one or two concepts. Don't be excessively dense. Avoid buzzwords, don't use 'likely' or 'shifting'. Do not use capital cities in place of country names. Example: "Non-allied, not neutral: China plays partners off each other, leans toward Russia when it boxes out the West, and builds power by locking in influence across the Global South."`;

async function generateBatchSummaries(
  apiKey: string,
  batch: string[],
  attempt: number = 1
): Promise<Record<string, CountrySummary> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout for batch

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Write geopolitical profiles for these ${batch.length} countries: ${batch.join(", ")}` },
        ],
        temperature: 1.0,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    if (!content || content.length < 100) {
      throw new Error(`Empty or too short response (${content.length} chars)`);
    }

    // Extract JSON if wrapped in markdown
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(content);
    const results: Record<string, CountrySummary> = {};

    for (const country of batch) {
      const countryData = parsed[country];
      if (!countryData || !countryData.summary || !countryData.keyInterests || !countryData.alignments) {
        console.error(`  Missing data for ${country}`);
        continue;
      }

      // Ensure alignments starts with capital letter
      let alignments = countryData.alignments;
      if (alignments && alignments.length > 0) {
        alignments = alignments.charAt(0).toUpperCase() + alignments.slice(1);
      }

      results[country] = {
        country,
        summary: countryData.summary,
        keyInterests: countryData.keyInterests || [],
        alignments,
        generatedAt: new Date().toISOString(),
      };
    }

    return results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Retry on certain errors
    if (attempt < MAX_RETRIES) {
      const isRetryable =
        errorMsg.includes("JSON") ||
        errorMsg.includes("Empty") ||
        errorMsg.includes("500") ||
        errorMsg.includes("503") ||
        errorMsg.includes("429") ||
        errorMsg.includes("rate") ||
        errorMsg.includes("fetch") ||
        errorMsg.includes("abort");

      if (isRetryable) {
        console.log(`  Retry ${attempt}/${MAX_RETRIES} for batch...`);
        await sleep(RETRY_DELAY_MS * attempt);
        return generateBatchSummaries(apiKey, batch, attempt + 1);
      }
    }

    console.error(`Error for batch [${batch.join(", ")}]: ${errorMsg}`);
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY environment variable not set");
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load existing summaries if any
  let existingSummaries: Record<string, CountrySummary> = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingSummaries = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
      console.log(`Found ${Object.keys(existingSummaries).length} existing summaries`);
    } catch {
      console.log("Could not load existing summaries, starting fresh");
    }
  }

  // Check for --resume flag
  const resumeMode = process.argv.includes("--resume");
  const countriesToProcess = resumeMode
    ? countries.filter((c) => !existingSummaries[c])
    : countries;

  if (resumeMode && countriesToProcess.length < countries.length) {
    console.log(`Resume mode: skipping ${countries.length - countriesToProcess.length} already processed`);
  }

  console.log(`\nGenerating summaries for ${countriesToProcess.length} countries...`);
  console.log(`Using ${MODEL} via OpenRouter (${BATCH_SIZE} countries per prompt)\n`);

  const summaries: Record<string, CountrySummary> = { ...existingSummaries };
  let totalSuccesses = Object.keys(existingSummaries).length;
  let totalErrors = 0;

  // Process in batches - each batch is ONE API call with multiple countries
  for (let i = 0; i < countriesToProcess.length; i += BATCH_SIZE) {
    const batch = countriesToProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(countriesToProcess.length / BATCH_SIZE);

    console.log(`[Batch ${batchNum}/${totalBatches}] Processing: ${batch.join(", ")}`);

    const results = await generateBatchSummaries(apiKey, batch);

    if (results) {
      for (const [country, summary] of Object.entries(results)) {
        summaries[country] = summary;
        totalSuccesses++;
        console.log(`  ✓ ${country}`);
      }

      // Check for missing countries in this batch
      for (const country of batch) {
        if (!results[country]) {
          totalErrors++;
          console.log(`  ✗ ${country} (missing from response)`);
        }
      }

      // Save incrementally
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summaries, null, 2));
    } else {
      totalErrors += batch.length;
      batch.forEach(c => console.log(`  ✗ ${c}`));
    }

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < countriesToProcess.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log(`\nDone! Generated ${totalSuccesses} summaries, ${totalErrors} errors.`);
  console.log(`Saved to: ${OUTPUT_FILE}`);

  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
  }

  if (totalErrors > 0) {
    const failed = countries.filter((c) => !summaries[c]);
    console.log(`\nFailed (${failed.length}): ${failed.join(", ")}`);
    console.log("Run with --resume to retry");
  }
}

main().catch(console.error);
