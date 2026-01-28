import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const OUTPUT_FILE = path.join(__dirname, "../src/data/country-summaries/summaries.json");

// Use the online model with web search capability
const MODEL = "google/gemini-3-pro-preview:online";

// Retry config
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const DELAY_BETWEEN_COUNTRIES_MS = 3000;

interface CountrySummary {
  country: string;
  summary: string;
  keyInterests: string[];
  alignments: string;
  generatedAt: string;
}

// Countries that need updates due to significant 2025/2026 geopolitical developments
const COUNTRIES_TO_UPDATE = [
  "Greenland",
  "Denmark",
  "United States",
  "Syria",
  "Venezuela",
  "Iran",
  "South Korea",
  "Palestine",
  "Israel",
  "Armenia",
  "Azerbaijan",
  "Madagascar",
  "Timor-Leste", // Was missing
  "Chad",        // Was missing
  "Chile",       // Was missing
];

const BASE_SYSTEM_PROMPT = `You are a knowledgeable geopolitical analyst updating country profiles with the latest information.

TASK: You will be given a country name and its PREVIOUS profile. Your job is to:
1. Search for significant geopolitical developments in 2025 and 2026
2. Decide whether the profile needs minor updates or a complete rewrite
3. Return an updated profile that reflects the current reality

WRITING STYLE - THIS IS CRITICAL:
- Write at a journalistic grade 11 reading level.
- Focus on facts and specific events. Avoid abstract jargon.
- If there are competing ideologies within the country, talk about their respective perspectives on the world.
- Vary your sentence structure. Mix short punchy sentences with longer explanatory ones.
- NEVER use these overused words/phrases: "robust", "multifaceted", "significant", "notable", "plays a key role", "maintains strong ties", "strategic partnership", "geopolitical landscape", "landscape", "shifting"
- Don't start with "[Country] is..." - find more interesting openings
- Include specific details when possible (treaty names, organizations, historical events)
- Have a point of view - what makes this country's position interesting or unique?
- If referencing specific individuals, use their title (e.g. President Trump, President Putin)
- Do not use capital cities to reference countries, instead use the name of that country

CONTENT TO COVER:
1. What are this country's top 2-3 geopolitical priorities? (security, trade, regional influence, etc.)
2. Who are their key allies and why?
3. Any notable tensions or rivalries?
4. What makes their position unique or interesting?

Return JSON:
{
  "summary": "150-200 word summary here...",
  "keyInterests": ["Interest one (4-6 words)", "Interest two (4-6 words)", "Interest three (4-6 words)"],
  "alignments": "One sentence description (15-25 words). Use the country name but don't start with it."
}

IMPORTANT:
- Each keyInterest should be around 4-6 words. If a specific country matters significantly, mention them.
- For alignments: Write naturally, avoid buzzwords, don't use 'likely'. Example: "Caught between its historical ties to France and a burgeoning relationship with Russia, Mali's allegiances are shifting amid a search for security guarantees."
- SEARCH THE WEB for the latest 2025 and 2026 developments before writing.
- If major events happened (regime change, war, treaties, elections), prioritize those.
- You may make minor edits OR completely rewrite the profile based on what you find.`;

async function updateCountrySummary(
  apiKey: string,
  country: string,
  oldSummary: CountrySummary | null,
  attempt: number = 1
): Promise<CountrySummary | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout for web search

    let userPrompt: string;
    if (oldSummary) {
      userPrompt = `Update the geopolitical profile for: ${country}

PREVIOUS PROFILE (written in late 2024/early 2025):
---
Summary: ${oldSummary.summary}

Key Interests: ${oldSummary.keyInterests.join(", ")}

Alignments: ${oldSummary.alignments}
---

Search for developments in 2025 and 2026. Update the profile as needed - minor edits or complete rewrite depending on what has changed.`;
    } else {
      userPrompt = `Write a new geopolitical profile for: ${country}

This country was missing from our database. Search for current information about its geopolitical position and write a fresh profile.`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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

    if (!parsed.summary || !parsed.keyInterests || !parsed.alignments) {
      throw new Error("Missing required fields in response");
    }

    // Ensure alignments starts with capital letter
    let alignments = parsed.alignments;
    if (alignments && alignments.length > 0) {
      alignments = alignments.charAt(0).toUpperCase() + alignments.slice(1);
    }

    return {
      country,
      summary: parsed.summary,
      keyInterests: parsed.keyInterests,
      alignments,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (attempt < MAX_RETRIES) {
      console.log(`  Retry ${attempt}/${MAX_RETRIES} for ${country}...`);
      await sleep(RETRY_DELAY_MS * attempt);
      return updateCountrySummary(apiKey, country, oldSummary, attempt + 1);
    }

    console.error(`Error for ${country}: ${errorMsg}`);
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

  // Load existing summaries
  let summaries: Record<string, CountrySummary> = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      summaries = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
      console.log(`Loaded ${Object.keys(summaries).length} existing summaries`);
    } catch {
      console.error("Could not load existing summaries");
      process.exit(1);
    }
  }

  console.log(`\nUpdating ${COUNTRIES_TO_UPDATE.length} countries with web search...`);
  console.log(`Using ${MODEL} (web-grounded)\n`);

  let successes = 0;
  let failures = 0;

  for (let i = 0; i < COUNTRIES_TO_UPDATE.length; i++) {
    const country = COUNTRIES_TO_UPDATE[i];
    const oldSummary = summaries[country] || null;

    console.log(`[${i + 1}/${COUNTRIES_TO_UPDATE.length}] ${country}${oldSummary ? " (updating)" : " (NEW)"}...`);

    const result = await updateCountrySummary(apiKey, country, oldSummary);

    if (result) {
      summaries[country] = result;
      successes++;
      console.log(`  ✓ Updated`);

      // Save after each success
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summaries, null, 2));
    } else {
      failures++;
      console.log(`  ✗ Failed`);
    }

    // Delay between countries (except for last one)
    if (i < COUNTRIES_TO_UPDATE.length - 1) {
      await sleep(DELAY_BETWEEN_COUNTRIES_MS);
    }
  }

  console.log(`\nDone! Updated ${successes} countries, ${failures} failures.`);

  if (failures > 0) {
    const failed = COUNTRIES_TO_UPDATE.filter((c) => !summaries[c] || summaries[c].generatedAt < new Date(Date.now() - 60000).toISOString());
    console.log(`Failed: ${failed.join(", ")}`);
  }
}

main().catch(console.error);
