import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

// Store api reference to avoid deep type instantiation in actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const issuesApi = api.issues as any;

// Batch size for country grouping
const BATCH_SIZE = 10;
const DEFAULT_NUM_RUNS = 2; // Default number of runs to average (user configurable)

// Geopolitical context annotations for countries (to update AI beyond training cutoff)
const COUNTRY_ANNOTATIONS: Record<string, string> = {
  "United States": "(Trump won 2024 Election)",
  "Syria": "(Post-Assad Transition Government)",
};

// Helper to annotate country names with geopolitical context
function annotateCountry(country: string): string {
  const annotation = COUNTRY_ANNOTATIONS[country];
  return annotation ? `${country} ${annotation}` : country;
}

// AI logging mutation
export const logAiRequest = mutation({
  args: {
    timestamp: v.number(),
    action: v.string(),
    model: v.string(),
    systemPrompt: v.string(),
    userPrompt: v.string(),
    requestBody: v.string(),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiLogs", args);
  },
});

// Max retries for transient/retryable errors
const MAX_RETRIES = 3;

// Custom error class to distinguish retryable errors
class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

// Helper to make logged OpenRouter requests with retry logic
async function fetchOpenRouterWithLogging(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  actionName: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  temperature: number = 0.3
): Promise<{ content: string; raw: unknown }> {
  const requestBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: 4000, // Limit response size to prevent runaway generation
    response_format: { type: "json_object" },
    provider: {
      ignore: ["google-vertex"],
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let error: string | undefined;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      responseStatus = response.status;
      const responseText = await response.text();
      responseBody = responseText.substring(0, 5000); // Truncate for storage

      if (!response.ok) {
        error = `HTTP ${response.status}: ${responseText.substring(0, 500)}`;
        // Don't retry HTTP errors (auth failures, rate limits should be handled differently)
        // Detect HTML error pages and provide a cleaner message
        const isHtmlError = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');
        if (isHtmlError) {
          if (response.status >= 500) {
            throw new Error(`OpenRouter is experiencing server issues (HTTP ${response.status}). Please try again in a few minutes.`);
          } else {
            throw new Error(`OpenRouter API error (HTTP ${response.status}). Please try again.`);
          }
        }
        // Try to parse JSON error response
        try {
          const errorJson = JSON.parse(responseText);
          const errorMessage = errorJson.error?.message || errorJson.message || responseText.substring(0, 200);
          throw new Error(`OpenRouter API error: ${errorMessage}`);
        } catch {
          // Not JSON, truncate and show
          throw new Error(`OpenRouter API error (HTTP ${response.status}): ${responseText.substring(0, 200)}`);
        }
      }

      const data = JSON.parse(responseText);
      let content = data.choices[0]?.message?.content;

      if (!content) {
        error = "No content in response";
        throw new RetryableError("No content in OpenRouter response");
      }

      // Clean up the content
      content = content.trim();

      // If content is mostly whitespace or extremely long, it's probably garbage
      const nonWhitespace = content.replace(/\s/g, '');
      if (nonWhitespace.length < 10) {
        error = `Response is mostly whitespace (attempt ${attempt}/${MAX_RETRIES})`;
        throw new RetryableError("AI returned mostly whitespace");
      }

      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }

      // Validate it's parseable JSON before returning
      try {
        JSON.parse(content);
      } catch (parseError) {
        error = `Invalid JSON (attempt ${attempt}/${MAX_RETRIES}): ${parseError instanceof Error ? parseError.message : 'parse error'}`;
        throw new RetryableError("AI returned invalid JSON");
      }

      // Success - log and return
      const durationMs = Date.now() - startTime;
      await ctx.runMutation(api.ai.logAiRequest, {
        timestamp: startTime,
        action: `${actionName}${attempt > 1 ? ` (attempt ${attempt})` : ''}`,
        model,
        systemPrompt: systemPrompt.substring(0, 2000),
        userPrompt: userPrompt.substring(0, 2000),
        requestBody: JSON.stringify(requestBody).substring(0, 5000),
        responseStatus,
        responseBody,
        error,
        durationMs,
      }).catch(console.error);

      return { content, raw: data };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      error = error || (err instanceof Error ? err.message : "Unknown error");

      // Log this attempt
      await ctx.runMutation(api.ai.logAiRequest, {
        timestamp: startTime,
        action: `${actionName} (attempt ${attempt}/${MAX_RETRIES})`,
        model,
        systemPrompt: systemPrompt.substring(0, 2000),
        userPrompt: userPrompt.substring(0, 2000),
        requestBody: JSON.stringify(requestBody).substring(0, 5000),
        responseStatus,
        responseBody,
        error,
        durationMs,
      }).catch(console.error);

      lastError = err instanceof Error ? err : new Error(String(err));

      // Only retry for RetryableError
      if (err instanceof RetryableError && attempt < MAX_RETRIES) {
        console.log(`Retrying ${actionName} (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        continue;
      }

      // Non-retryable error or max retries reached
      throw lastError;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error("Max retries exceeded");
}

// Type for score results
type CountryScore = {
  countryName: string;
  score: number;
  reasoning?: string;
};

// Types for database entities (to avoid deep type instantiation issues)
type IssueType = {
  _id: string;
  title: string;
  description: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
  mapVersionId: string;
  generatedAt: number;
  isActive: boolean;
  source: "daily" | "custom";
};

type MapVersionType = {
  _id: string;
  version: string;
  topojsonFile: string;
  countriesFile: string;
  countryCount: number;
  countries: string[];
  createdAt: number;
  isActive: boolean;
};

// Shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Split array into batches
function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// Parse prompt into Side A / Side B structure
export const parsePromptToSides = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{
    title: string;
    description: string;
    sideA: { label: string; description: string };
    sideB: { label: string; description: string };
  }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const systemPrompt = `You are an expert at analyzing geopolitical scenarios. Given a user prompt, parse it into a structured format with two opposing sides.

Try your best to interpret the prompt as a geopolitical scenario. Be creative - most topics can be framed geopolitically (technology, climate, trade, cultural issues, etc.).

Return a JSON object with:
- title: A concise title for the issue (max 100 chars)
- description: A brief description of the overall scenario (1-2 sentences)
- sideA: The side that supports/approves/is in favor (object with "label" and "description")
- sideB: The side that opposes/disapproves/is against (object with "label" and "description")

IMPORTANT: The "description" for each side should describe the POSITION itself, NOT predict which countries or actors would take that position. That prediction is done separately.

For example, if the prompt is "US annexation of Greenland", you might return:
{
  "title": "US Annexation of Greenland",
  "description": "The potential acquisition of Greenland by the United States.",
  "sideA": { "label": "Pro-Annexation", "description": "Supports US acquisition of Greenland" },
  "sideB": { "label": "Anti-Annexation", "description": "Opposes US acquisition of Greenland" }
}

For "Ukraine's accession to the European Union":
{
  "title": "Ukraine's Accession to the European Union",
  "description": "Ukraine seeks full membership in the EU, prompting diplomatic debate over the political, economic, and security implications.",
  "sideA": { "label": "Pro-Accession", "description": "Supports Ukraine joining the European Union" },
  "sideB": { "label": "Anti-Accession", "description": "Opposes Ukraine joining the European Union" }
}

If the prompt is truly unparseable (gibberish, completely unrelated to world affairs like "make me a sandwich", or too vague to interpret), return:
{ "error": "Brief explanation of why this can't be parsed as a geopolitical scenario" }

Only return valid JSON, no additional text.`;

    const MODEL = "openai/gpt-oss-120b:exacto";
    const { content } = await fetchOpenRouterWithLogging(
      ctx,
      "parsePromptToSides",
      MODEL,
      systemPrompt,
      args.prompt,
      openaiApiKey,
      0.3
    );

    const parsed = JSON.parse(content);

    // If AI returned an error, pass it through
    if (parsed.error) {
      return parsed;
    }

    // Validate and sanitize the response structure
    if (!parsed.title || !parsed.sideA || !parsed.sideB) {
      throw new Error("AI returned incomplete response - missing required fields");
    }

    // Sanitize strings (trim whitespace, remove control characters)
    const sanitize = (s: string) => s?.trim().replace(/[\x00-\x1F\x7F]/g, '') || '';

    return {
      title: sanitize(parsed.title),
      description: sanitize(parsed.description || ''),
      sideA: {
        label: sanitize(parsed.sideA.label || 'Supports'),
        description: sanitize(parsed.sideA.description || ''),
      },
      sideB: {
        label: sanitize(parsed.sideB.label || 'Opposes'),
        description: sanitize(parsed.sideB.description || ''),
      },
    };
  },
});

// Phase 2: Generate scores with progress tracking
// Called after user confirms the parsed scenario
export const generateScoresWithProgress = action({
  args: {
    title: v.string(),
    description: v.string(),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    numRuns: v.optional(v.number()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    issueId?: string;
    jobId?: string;
    error?: string;
  }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const numRuns = args.numRuns ?? DEFAULT_NUM_RUNS;

    try {
      // Get active map version
      const mapVersion = await ctx.runQuery(issuesApi.getActiveMapVersion, {}) as MapVersionType | null;
      if (!mapVersion) {
        throw new Error("No active map version found");
      }

      // Create the issue
      const issueId = await ctx.runMutation(issuesApi.createIssue, {
        title: args.title,
        description: args.description,
        sideA: args.sideA,
        sideB: args.sideB,
        mapVersionId: mapVersion._id,
        source: "custom",
        isActive: false,
        userId: args.userId,
      });

      const countries = mapVersion.countries;
      const batches = batchArray(countries, BATCH_SIZE);
      const totalBatches = batches.length * numRuns;

      // Create job with progress info
      const jobId = await ctx.runMutation(issuesApi.createGenerationJobWithProgress, {
        issueId,
        totalBatches,
        totalRuns: numRuns,
      });

      // Track completed batches across all parallel requests
      let completedBatches = 0;

      // Helper to process a single batch and return its scores
      const processBatch = async (batch: string[]): Promise<Record<string, { score: number; reasoning?: string }>> => {
        const batchScores = await generateScoresForBatch(
          ctx,
          openaiApiKey,
          args.title,
          args.description,
          args.sideA,
          args.sideB,
          batch
        );

        // Update progress (non-blocking - conflicts are OK since batches run in parallel)
        completedBatches++;
        const progress = Math.round((completedBatches / totalBatches) * 100);
        ctx.runMutation(issuesApi.updateJobStatus, {
          jobId,
          completedBatches,
          progress,
        }).catch(() => {
          // Ignore conflicts - progress updates are best-effort with parallel execution
        });

        return batchScores;
      };

      // Create all batch promises across all runs (fully parallel)
      const allBatchPromises: Promise<Record<string, { score: number; reasoning?: string }>>[] = [];

      for (let run = 0; run < numRuns; run++) {
        const shuffledCountries = shuffleArray(countries);
        const runBatches = batchArray(shuffledCountries, BATCH_SIZE);

        for (const batch of runBatches) {
          allBatchPromises.push(processBatch(batch));
        }
      }

      // Execute all batches in parallel
      const allBatchResults = await Promise.all(allBatchPromises);

      // Merge results from all batches
      const scoreAccumulator: Record<string, { total: number; count: number; reasonings: string[] }> = {};
      countries.forEach((country) => {
        scoreAccumulator[country] = { total: 0, count: 0, reasonings: [] };
      });

      for (const batchResult of allBatchResults) {
        for (const [country, data] of Object.entries(batchResult)) {
          if (scoreAccumulator[country]) {
            scoreAccumulator[country].total += data.score;
            scoreAccumulator[country].count += 1;
            if (data.reasoning) {
              scoreAccumulator[country].reasonings.push(data.reasoning);
            }
          }
        }
      }

      // Calculate averaged scores
      const finalScores: CountryScore[] = countries.map((country) => {
        const acc = scoreAccumulator[country];
        const avgScore = acc.count > 0 ? acc.total / acc.count : 0;
        const reasoning = acc.reasonings.length > 0 ? acc.reasonings[0] : undefined;
        return {
          countryName: country,
          score: Math.max(-1, Math.min(1, avgScore)),
          reasoning,
        };
      });

      // Save scores to database
      await ctx.runMutation(issuesApi.saveCountryScores, {
        issueId,
        scores: finalScores,
      });

      // Activate the issue and mark job complete
      await ctx.runMutation(issuesApi.updateIssueActive, {
        issueId,
        isActive: true,
      });

      await ctx.runMutation(issuesApi.updateJobStatus, {
        jobId,
        status: "completed",
        progress: 100,
      });

      return { success: true, issueId, jobId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Generate batch scores for an issue (batch mode for hypotheticals)
export const generateBatchScores = action({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; scoreCount: number }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    // Get issue details - use type assertion to avoid deep type instantiation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issue = await (ctx.runQuery as any)(issuesApi.getIssueById, {
      issueId: args.issueId,
    }) as IssueType | null;

    if (!issue) {
      throw new Error("Issue not found");
    }

    // Get map version separately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapVersion = await (ctx.runQuery as any)(issuesApi.getMapVersionById, {
      mapVersionId: issue.mapVersionId,
    }) as MapVersionType | null;

    if (!mapVersion) {
      throw new Error("Map version not found");
    }

    const countries = mapVersion.countries;

    // Accumulate scores across multiple runs
    const scoreAccumulator: Record<string, { total: number; count: number; reasonings: string[] }> = {};
    countries.forEach((country) => {
      scoreAccumulator[country] = { total: 0, count: 0, reasonings: [] };
    });

    // Run batch generation multiple times and average
    for (let run = 0; run < DEFAULT_NUM_RUNS; run++) {
      const shuffledCountries = shuffleArray(countries);
      const batches = batchArray(shuffledCountries, BATCH_SIZE);

      for (const batch of batches) {
        const batchScores = await generateScoresForBatch(
          ctx,
          openaiApiKey,
          issue.title,
          issue.description,
          issue.sideA,
          issue.sideB,
          batch
        );

        // Accumulate scores
        for (const [country, data] of Object.entries(batchScores)) {
          if (scoreAccumulator[country]) {
            scoreAccumulator[country].total += data.score;
            scoreAccumulator[country].count += 1;
            if (data.reasoning) {
              scoreAccumulator[country].reasonings.push(data.reasoning);
            }
          }
        }
      }
    }

    // Calculate averaged scores
    const finalScores: CountryScore[] = countries.map((country) => {
      const acc = scoreAccumulator[country];
      const avgScore = acc.count > 0 ? acc.total / acc.count : 0;
      // Pick the most common reasoning or first one
      const reasoning = acc.reasonings.length > 0 ? acc.reasonings[0] : undefined;
      return {
        countryName: country,
        score: Math.max(-1, Math.min(1, avgScore)), // Clamp to [-1, 1]
        reasoning,
      };
    });

    // Save scores to database
    await ctx.runMutation(issuesApi.saveCountryScores, {
      issueId: args.issueId,
      scores: finalScores,
    });

    return { success: true, scoreCount: finalScores.length };
  },
});

// Helper function to generate scores for a batch of countries
async function generateScoresForBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  apiKey: string,
  title: string,
  description: string,
  sideA: { label: string; description: string },
  sideB: { label: string; description: string },
  countries: string[]
): Promise<Record<string, { score: number; reasoning?: string }>> {
  const systemPrompt = `You are an expert geopolitical analyst. You will rate each country's likely position on a given issue.

SCENARIO: ${title}
${description}

SIDE A (${sideA.label}): ${sideA.description} → positive scores (0 to 1)
SIDE B (${sideB.label}): ${sideB.description} → negative scores (-1 to 0)

Rate each country from -1 to 1 where:
- 1.0 = Strongly supports Side A
- 0.5 = Moderately supports Side A
- 0.0 = Neutral / No clear position
- -0.5 = Moderately supports Side B
- -1.0 = Strongly supports Side B

Consider:
- Current alliances and treaties
- Economic ties and dependencies
- Ideological alignment
- Historical relationships
- Regional interests
- Domestic political considerations

Return a JSON object with this exact structure:
{
  "scores": {
    "CountryName": { "score": 0.5, "reasoning": "Brief explanation" },
    ...
  }
}

Only return valid JSON, no additional text. Country names in your response must match exactly as provided (without any annotations).`;

  // Annotate countries with geopolitical context for the AI
  const annotatedCountries = countries.map(annotateCountry);
  const userPrompt = `Rate these countries: ${annotatedCountries.join(", ")}`;
  const MODEL = "openai/gpt-oss-120b:exacto";

  const { content } = await fetchOpenRouterWithLogging(
    ctx,
    "generateScoresForBatch",
    MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    0.5
  );
  const parsed = JSON.parse(content);
  return parsed.scores || {};
}

// Helper function to parse prompt to sides (for internal use)
async function parsePromptToSidesInternal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  apiKey: string,
  prompt: string
): Promise<{
  title: string;
  description: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
}> {
  const systemPrompt = `You are an expert at analyzing geopolitical scenarios. Given a user prompt describing a scenario or issue, parse it into a structured format with two opposing sides.

Return a JSON object with:
- title: A concise title for the issue (max 100 chars)
- description: A brief description of the overall scenario (1-2 sentences)
- sideA: The side that supports/approves/is in favor (object with "label" and "description")
- sideB: The side that opposes/disapproves/is against (object with "label" and "description")

IMPORTANT: The "description" for each side should describe the POSITION itself, NOT predict which countries or actors would take that position. That prediction is done separately.

For example, if the prompt is "US annexation of Greenland", you might return:
{
  "title": "US Annexation of Greenland",
  "description": "The potential acquisition of Greenland by the United States.",
  "sideA": { "label": "Pro-Annexation", "description": "Supports US acquisition of Greenland" },
  "sideB": { "label": "Anti-Annexation", "description": "Opposes US acquisition of Greenland" }
}

Only return valid JSON, no additional text.`;

  const MODEL = "openai/gpt-oss-120b:exacto";
  const { content } = await fetchOpenRouterWithLogging(
    ctx,
    "parsePromptToSidesInternal",
    MODEL,
    systemPrompt,
    prompt,
    apiKey,
    0.3
  );

  return JSON.parse(content);
}

// Process a custom prompt end-to-end
export const processCustomPrompt = action({
  args: {
    promptId: v.id("customPrompts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; issueId?: string; error?: string }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    try {
      // Get the prompt
      const prompt = await ctx.runQuery(issuesApi.getPromptById, {
        promptId: args.promptId,
      });

      if (!prompt) {
        throw new Error("Prompt not found");
      }

      // Update status to processing
      await ctx.runMutation(issuesApi.updatePromptStatus, {
        promptId: args.promptId,
        status: "processing",
      });

      // Get active map version
      const mapVersion = await ctx.runQuery(issuesApi.getActiveMapVersion, {});

      if (!mapVersion) {
        throw new Error("No active map version found");
      }

      // Parse prompt into sides (inline)
      const parsedIssue = await parsePromptToSidesInternal(ctx, openaiApiKey, prompt.prompt);

      // Create the issue
      const issueId = await ctx.runMutation(issuesApi.createIssue, {
        title: parsedIssue.title,
        description: parsedIssue.description,
        sideA: parsedIssue.sideA,
        sideB: parsedIssue.sideB,
        mapVersionId: mapVersion._id,
        source: "custom",
        isActive: false,
      });

      // Create generation job
      await ctx.runMutation(issuesApi.createGenerationJob, {
        issueId,
      });

      // Generate scores (inline the batch generation logic)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const issue = await (ctx.runQuery as any)(issuesApi.getIssueById, {
        issueId,
      }) as IssueType | null;

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Get map version separately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mv = await (ctx.runQuery as any)(issuesApi.getMapVersionById, {
        mapVersionId: issue.mapVersionId,
      }) as MapVersionType | null;

      if (!mv) {
        throw new Error("Map version not found");
      }
      const countries = mv.countries;

      // Accumulate scores across multiple runs
      const scoreAccumulator: Record<string, { total: number; count: number; reasonings: string[] }> = {};
      countries.forEach((country) => {
        scoreAccumulator[country] = { total: 0, count: 0, reasonings: [] };
      });

      // Run batch generation multiple times and average
      for (let run = 0; run < DEFAULT_NUM_RUNS; run++) {
        const shuffledCountries = shuffleArray(countries);
        const batches = batchArray(shuffledCountries, BATCH_SIZE);

        for (const batch of batches) {
          const batchScores = await generateScoresForBatch(
            ctx,
            openaiApiKey,
            issue.title,
            issue.description,
            issue.sideA,
            issue.sideB,
            batch
          );

          // Accumulate scores
          for (const [country, data] of Object.entries(batchScores)) {
            if (scoreAccumulator[country]) {
              scoreAccumulator[country].total += data.score;
              scoreAccumulator[country].count += 1;
              if (data.reasoning) {
                scoreAccumulator[country].reasonings.push(data.reasoning);
              }
            }
          }
        }
      }

      // Calculate averaged scores
      const finalScores: CountryScore[] = countries.map((country) => {
        const acc = scoreAccumulator[country];
        const avgScore = acc.count > 0 ? acc.total / acc.count : 0;
        const reasoning = acc.reasonings.length > 0 ? acc.reasonings[0] : undefined;
        return {
          countryName: country,
          score: Math.max(-1, Math.min(1, avgScore)),
          reasoning,
        };
      });

      // Save scores to database
      await ctx.runMutation(issuesApi.saveCountryScores, {
        issueId,
        scores: finalScores,
      });

      // Update prompt with completed status and issue ID
      await ctx.runMutation(issuesApi.updatePromptStatus, {
        promptId: args.promptId,
        status: "completed",
        issueId,
      });

      // Activate the issue
      await ctx.runMutation(issuesApi.updateIssueActive, {
        issueId,
        isActive: true,
      });

      return { success: true, issueId: issueId };
    } catch (error) {
      // Update prompt with failed status
      await ctx.runMutation(issuesApi.updatePromptStatus, {
        promptId: args.promptId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
