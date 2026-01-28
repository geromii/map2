import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";

// Store api references to avoid deep type instantiation in actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const issuesApi = api.issues as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const headlinesApi = api.headlines as any;

// Batch size for country grouping
const BATCH_SIZE = 5;
const DEFAULT_NUM_RUNS = 2; // Default number of runs to average (user configurable)

// Geopolitical context updates for countries (to update AI beyond training cutoff)
// These sentences are appended to the prompt when the country is being rated
const COUNTRY_CONTEXT: Record<string, string> = {
  "United States": "Donald Trump won the 2024 Presidential Election.",
  "Syria": "Syria deposed Assad, currently has a transitional government and uncertain geopolitical alliances.",
  "Argentina": "Right-wing Libertarian Candidate Javier Milei is currently Argentina's President"
};

// Helper to build context sentences for countries in a batch
function buildCountryContext(countries: string[]): string {
  const contextSentences: string[] = [];
  for (const country of countries) {
    if (COUNTRY_CONTEXT[country]) {
      contextSentences.push(COUNTRY_CONTEXT[country]);
    }
  }
  return contextSentences.length > 0
    ? `\n\nRecent updates: ${contextSentences.join(" ")}`
    : "";
}

// AI logging mutation
export const logAiRequest = mutation({
  args: {
    timestamp: v.number(),
    action: v.string(),
    model: v.string(),
    provider: v.optional(v.string()), // e.g., "google-ai-studio", "openrouter"
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
  temperature: number = 0.3,
  timeoutMs?: number
): Promise<{ content: string; raw: unknown }> {
  const requestBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: 8000, // Limit response size to prevent runaway generation
    response_format: { type: "json_object" },
    provider: {
      ignore: [],
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let error: string | undefined;

    try {
      const controller = timeoutMs ? new AbortController() : undefined;
      const timeoutId = timeoutMs && controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : undefined;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller?.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      responseStatus = response.status;
      const responseText = await response.text();
      responseBody = responseText.trim().substring(0, 5000); // Trim whitespace and truncate for storage

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
        provider: "openrouter",
        systemPrompt: systemPrompt.substring(0, 4000),
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
        provider: "openrouter",
        systemPrompt: systemPrompt.substring(0, 4000),
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

// Gemini model options
const GEMINI_MODELS = {
  "2.0-flash": "gemini-2.0-flash",
  "2.5-flash": "gemini-2.5-flash-preview-05-20",
  "3.0-flash": "gemini-3-flash-preview",
  "3.0-pro": "gemini-3-pro-preview",
} as const;
type GeminiModelVersion = keyof typeof GEMINI_MODELS;

// Default model for headline generation
const DEFAULT_GEMINI_MODEL: GeminiModelVersion = "3.0-flash";

// Model for custom scenarios (uses Gemini directly without web grounding)
const SCENARIO_MODEL: GeminiModelVersion = "2.0-flash";

// Helper to make logged Google Gemini requests with search grounding and retry logic
async function fetchGeminiWithLogging(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  actionName: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  useSearchGrounding: boolean = false,
  temperature: number = 0.3,
  timeoutMs?: number,
  modelVersion: GeminiModelVersion = DEFAULT_GEMINI_MODEL
): Promise<{ content: string; raw: unknown }> {
  const model = GEMINI_MODELS[modelVersion];

  // Build the config with optional search grounding
  // Note: Gemini 2.5 does NOT support responseMimeType with tools
  // Gemini 3.0 supports both together
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    temperature,
    maxOutputTokens: 8000,
  };

  // Add search grounding tool if enabled
  if (useSearchGrounding) {
    config.tools = [{ googleSearch: {} }];
    // 3.0 models support JSON response format with tools
    if (modelVersion === "3.0-flash" || modelVersion === "3.0-pro") {
      config.responseMimeType = "application/json";
    }
  } else {
    // Without tools, both models support JSON response format
    config.responseMimeType = "application/json";
  }

  const ai = new GoogleGenAI({ apiKey });
  const combinedPrompt = `${systemPrompt}\n\n---\n\nUser request: ${userPrompt}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    let responseBody: string | undefined;
    let error: string | undefined;

    try {
      // Create abort controller for timeout
      const controller = timeoutMs ? new AbortController() : undefined;
      const timeoutId = timeoutMs && controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : undefined;

      const response = await ai.models.generateContent({
        model,
        contents: combinedPrompt,
        config,
      });

      if (timeoutId) clearTimeout(timeoutId);

      let content = response.text || "";

      // Build comprehensive response body with metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData: any = {
        text: content.substring(0, 3000), // Truncate text to leave room for metadata
      };

      // Add usage metadata if available
      if (response.usageMetadata) {
        responseData.usage = response.usageMetadata;
      }

      // Add grounding metadata if available (search sources, queries)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidate = (response as any).candidates?.[0];
      if (candidate?.groundingMetadata) {
        const gm = candidate.groundingMetadata;
        responseData.grounding = {
          searchQueries: gm.webSearchQueries,
          // Extract just URLs and titles from grounding chunks to save space
          sources: gm.groundingChunks?.slice(0, 10)?.map((chunk: { web?: { uri?: string; title?: string } }) => ({
            url: chunk.web?.uri,
            title: chunk.web?.title,
          })),
        };
      }

      // Add finish reason if available
      if (candidate?.finishReason) {
        responseData.finishReason = candidate.finishReason;
      }

      responseBody = JSON.stringify(responseData).substring(0, 5000);

      if (!content || content.trim().length < 10) {
        error = `Gemini returned empty or minimal response (attempt ${attempt}/${MAX_RETRIES})`;
        throw new RetryableError(error);
      }

      // Clean up the content
      content = content.trim();

      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }

      // Validate it's parseable JSON
      try {
        JSON.parse(content);
      } catch (parseError) {
        error = `Invalid JSON from Gemini (attempt ${attempt}/${MAX_RETRIES}): ${parseError instanceof Error ? parseError.message : 'parse error'}`;
        throw new RetryableError(error);
      }

      // Success - log and return
      const durationMs = Date.now() - startTime;
      await ctx.runMutation(api.ai.logAiRequest, {
        timestamp: startTime,
        action: `${actionName}${attempt > 1 ? ` (attempt ${attempt})` : ''}`,
        model: model + (useSearchGrounding ? " (search grounded)" : ""),
        provider: "google-ai-studio",
        systemPrompt: systemPrompt.substring(0, 4000),
        userPrompt: userPrompt.substring(0, 2000),
        requestBody: JSON.stringify({ model, config }).substring(0, 5000),
        responseStatus: 200,
        responseBody,
        durationMs,
      }).catch(console.error);

      return { content, raw: response };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      error = error || (err instanceof Error ? err.message : "Unknown error");

      // Log this attempt
      await ctx.runMutation(api.ai.logAiRequest, {
        timestamp: startTime,
        action: `${actionName} (attempt ${attempt}/${MAX_RETRIES})`,
        model: model + (useSearchGrounding ? " (search grounded)" : ""),
        provider: "google-ai-studio",
        systemPrompt: systemPrompt.substring(0, 4000),
        userPrompt: userPrompt.substring(0, 2000),
        requestBody: JSON.stringify({ model, config }).substring(0, 5000),
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

// Sliding window rate limiter for API calls
// Tracks request timestamps and ensures we don't exceed maxRPM requests per minute
class RateLimiter {
  private timestamps: number[] = [];
  private maxRPM: number;

  constructor(maxRPM: number = 20) {
    this.maxRPM = maxRPM;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than 60 seconds
    while (this.timestamps.length > 0 && this.timestamps[0] < now - 60000) {
      this.timestamps.shift();
    }

    // If at limit, wait until oldest expires
    if (this.timestamps.length >= this.maxRPM) {
      const waitTime = this.timestamps[0] + 60000 - now + 100; // +100ms buffer
      console.log(`Rate limit reached, waiting ${Math.round(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Clean up again after waiting
      const newNow = Date.now();
      while (this.timestamps.length > 0 && this.timestamps[0] < newNow - 60000) {
        this.timestamps.shift();
      }
    }

    this.timestamps.push(Date.now());
  }
}

// Helper to process batches with rate limiting
// Fires requests as fast as allowed, doesn't wait for responses between sends
async function processWithRateLimit<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  maxRPM: number = 20
): Promise<PromiseSettledResult<void>[]> {
  const limiter = new RateLimiter(maxRPM);

  const promises = items.map(async (item) => {
    await limiter.waitForSlot();
    return processor(item);
  });

  return Promise.allSettled(promises);
}

// Split array into batches
function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// Model choice type for API
const modelChoiceValidator = v.optional(v.union(
  v.literal("2.0-flash"),
  v.literal("2.5-flash"),
  v.literal("3.0-flash"),
  v.literal("3.0-flash-fallback"),
  v.literal("3.0-pro")
));

// Parse prompt into Side A / Side B structure
// Headlines: Parse prompt into Side A / Side B structure (used by /admin/headlines)
export const parsePromptToSides = action({
  args: {
    prompt: v.string(),
    useWebGrounding: v.optional(v.boolean()),
    modelChoice: modelChoiceValidator,
  },
  handler: async (ctx, args): Promise<{
    title: string;
    slug: string;
    description: string;
    primaryActor?: string;
    sideA: { label: string; description: string };
    sideB: { label: string; description: string };
  } | { error: string }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const webGroundingInstructions = args.useWebGrounding ? `
IMPORTANT - WEB SEARCH INSTRUCTIONS:
Search for the latest news and current events related to this topic. The "description" field should summarize WHAT IS CURRENTLY HAPPENING in the news regarding this issue - recent developments, announcements, reactions, or events. Be specific with dates and details from your search results.

` : '';

    const systemPrompt = `You are an expert at analyzing geopolitical scenarios. Given a user prompt, parse it into a structured format with two opposing sides.

Try your best to interpret the prompt as a geopolitical scenario. Be creative - most topics can be framed geopolitically (technology, climate, trade, cultural issues, etc.).
${webGroundingInstructions}
Return a JSON object with:
- title: A concise title for the issue (max 100 chars)
- slug: A brief URL-friendly slug for shareable links (lowercase, hyphens only, 3-5 words max, e.g., "us-greenland-annexation", "korea-reunification", "quebec-independence")
- description: ${args.useWebGrounding ? 'A summary of CURRENT NEWS and recent developments on this topic (2-3 sentences). Include specific recent events, dates, or announcements from your web search.' : 'A brief description of the overall scenario (1-2 sentences)'}
- primaryActor: The entity pushing for or driving this scenario (Side A only). This is who would "win" or "succeed" if the scenario comes to pass. Can be one or multiple countries, organizations, movements, or groups. If multiple, separate with " and " (e.g., "United States and United Kingdom"). This should ONLY represent one side of the issue - the proponents, not both sides.
- sideA: The side that supports/approves/is in favor (object with "label" and "description")
- sideB: The side that opposes/disapproves/is against (object with "label" and "description")

IMPORTANT: The "description" for each side should describe the POSITION itself, NOT predict which countries or actors would take that position. That prediction is done separately.

For example, if the prompt is "US annexation of Greenland", you might return:
{
  "title": "US Annexation of Greenland",
  "slug": "us-greenland-annexation",
  "description": "The potential acquisition of Greenland by the United States.",
  "primaryActor": "United States",
  "sideA": { "label": "Pro-Annexation", "description": "Supports US acquisition of Greenland" },
  "sideB": { "label": "Anti-Annexation", "description": "Opposes US acquisition of Greenland" }
}

For "Korean reunification under South Korean democracy":
{
  "title": "Korean Reunification Under Democracy",
  "slug": "korea-reunification",
  "description": "The reunification of North and South Korea under a democratic government.",
  "primaryActor": "South Korea",
  "sideA": { "label": "Pro-Reunification", "description": "Supports democratic Korean reunification" },
  "sideB": { "label": "Anti-Reunification", "description": "Opposes democratic Korean reunification" }
}

For "America becomes communist":
{
  "title": "Communist Revolution in America",
  "slug": "america-communist-revolution",
  "description": "A scenario where the United States adopts a communist system of government.",
  "primaryActor": "American Communists",
  "sideA": { "label": "Pro-Communist", "description": "Supports communist transformation of America" },
  "sideB": { "label": "Anti-Communist", "description": "Opposes communist transformation of America" }
}

For "Quebec independence":
{
  "title": "Quebec Independence",
  "slug": "quebec-independence",
  "description": "Quebec separates from Canada to become an independent nation.",
  "primaryActor": "Quebec Separatists",
  "sideA": { "label": "Pro-Independence", "description": "Supports Quebec separating from Canada" },
  "sideB": { "label": "Anti-Independence", "description": "Opposes Quebec separating from Canada" }
}

For "AUKUS nuclear submarine program":
{
  "title": "AUKUS Nuclear Submarine Program",
  "slug": "aukus-submarines",
  "description": "Australia acquires nuclear-powered submarines through the AUKUS security pact.",
  "primaryActor": "Australia, United States, and United Kingdom",
  "sideA": { "label": "Pro-AUKUS", "description": "Supports the AUKUS submarine program" },
  "sideB": { "label": "Anti-AUKUS", "description": "Opposes the AUKUS submarine program" }
}

If the prompt is truly unparseable (gibberish, completely unrelated to world affairs like "make me a sandwich", or too vague to interpret), return:
{ "error": "Brief explanation of why this can't be parsed as a geopolitical scenario" }

If the user's message is in a language other than English, please issue your response in that language.

Only return valid JSON, no additional text.`;

    let content!: string; // Assigned in either branch below, or we throw
    const modelChoice = args.modelChoice || "3.0-flash-fallback";

    // Use Gemini with search grounding when web grounding is enabled
    if (args.useWebGrounding) {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set (required for web grounding)");
      }

      // Determine model version(s) to try
      const tryModels: GeminiModelVersion[] = modelChoice === "3.0-flash-fallback"
        ? ["3.0-flash", "2.5-flash"]
        : [modelChoice as GeminiModelVersion];

      let lastError: Error | null = null;
      for (const modelVersion of tryModels) {
        try {
          const result = await fetchGeminiWithLogging(
            ctx,
            "parsePromptToSides",
            systemPrompt,
            args.prompt,
            geminiApiKey,
            true, // useSearchGrounding
            0.3,
            45000, // 45 second timeout for search grounding
            modelVersion
          );
          content = result.content;
          lastError = null;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.log(`Model ${modelVersion} failed, ${tryModels.indexOf(modelVersion) < tryModels.length - 1 ? 'trying fallback...' : 'no more fallbacks'}`);
          if (tryModels.indexOf(modelVersion) >= tryModels.length - 1) {
            throw lastError;
          }
        }
      }
      if (lastError) throw lastError;
    } else {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set");
      }

      const result = await fetchGeminiWithLogging(
        ctx,
        "parsePromptToSides",
        systemPrompt,
        args.prompt,
        geminiApiKey,
        false, // no search grounding
        0.3,
        20000,
        SCENARIO_MODEL
      );
      content = result.content;
    }

    const parsed = JSON.parse(content);

    if (parsed.error) {
      return parsed;
    }

    if (!parsed.title || !parsed.sideA || !parsed.sideB) {
      throw new Error("AI returned incomplete response - missing required fields");
    }

    const sanitize = (s: string) => s?.trim().replace(/[\x00-\x1F\x7F]/g, '') || '';
    const sanitizeSlug = (s: string) =>
      s?.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || '';

    return {
      title: sanitize(parsed.title),
      slug: sanitizeSlug(parsed.slug || parsed.title),
      description: sanitize(parsed.description || ''),
      primaryActor: parsed.primaryActor ? sanitize(parsed.primaryActor) : undefined,
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

// Scenarios: Parse prompt into Side A / Side B structure (used by /scenario)
// Differences from headlines version:
// - No slug field (scenarios use random slugs)
// - War/conflict instructions (Pro-[SideA] vs Pro-[SideB] instead of Pro/Anti-War)
// - Always uses Gemini directly (no web grounding, no model choice)
export const parseScenarioPrompt = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{
    title: string;
    description: string;
    primaryActor?: string;
    sideA: { label: string; description: string };
    sideB: { label: string; description: string };
  } | { error: string }> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    const systemPrompt = `You are an expert at analyzing geopolitical scenarios. Given a user prompt, parse it into a structured format with two opposing sides.

Try your best to interpret the prompt as a geopolitical scenario. Be creative - most topics can be framed geopolitically (technology, climate, trade, cultural issues, etc.).

Return a JSON object with:
- title: A concise title for the issue (max 100 chars)
- description: A brief description of the overall scenario (1-2 sentences)
- primaryActor: The entity pushing for or driving this scenario (Side A only). This is who would "win" or "succeed" if the scenario comes to pass. Can be one or multiple countries, organizations, movements, or groups. If multiple, separate with " and " (e.g., "United States and United Kingdom"). This should ONLY represent one side of the issue - the proponents, not both sides.
- sideA: The side that supports/approves/is in favor (object with "label" and "description")
- sideB: The side that opposes/disapproves/is against (object with "label" and "description")

IMPORTANT: The "description" for each side should describe the POSITION itself, NOT predict which countries or actors would take that position. That prediction is done separately.

For example, if the prompt is "US annexation of Greenland":
{
  "title": "US Annexation of Greenland",
  "description": "The potential acquisition of Greenland by the United States.",
  "primaryActor": "United States",
  "sideA": { "label": "Pro-Annexation", "description": "Supports US acquisition of Greenland" },
  "sideB": { "label": "Anti-Annexation", "description": "Opposes US acquisition of Greenland" }
}

For "Quebec independence":
{
  "title": "Quebec Independence",
  "description": "Quebec separates from Canada to become an independent nation.",
  "primaryActor": "Quebec Separatists",
  "sideA": { "label": "Pro-Independence", "description": "Supports Quebec separating from Canada" },
  "sideB": { "label": "Anti-Independence", "description": "Opposes Quebec separating from Canada" }
}

WAR / CONFLICT SCENARIOS:
When the user describes a war or military conflict between two parties, do NOT use "Pro-War" / "Anti-War" as side labels. Instead, frame the sides as support for each belligerent. The primaryActor should be the aggressor. The description should note who the aggressor is.

For "Russia invades Ukraine":
{
  "title": "Russian Invasion of Ukraine",
  "description": "Russia, as the aggressor, launches a full-scale military invasion of Ukraine.",
  "primaryActor": "Russia",
  "sideA": { "label": "Pro-Russia", "description": "Supports Russia's military campaign in Ukraine" },
  "sideB": { "label": "Pro-Ukraine", "description": "Supports Ukraine's sovereignty and defense against Russia" }
}

For "China invades Taiwan":
{
  "title": "Chinese Invasion of Taiwan",
  "description": "China, as the aggressor, launches a military operation to annex Taiwan.",
  "primaryActor": "China",
  "sideA": { "label": "Pro-China", "description": "Supports Chinese reunification with Taiwan by force" },
  "sideB": { "label": "Pro-Taiwan", "description": "Supports Taiwanese independence and defense against China" }
}

If the prompt is truly unparseable (gibberish, completely unrelated to world affairs like "make me a sandwich", or too vague to interpret), return:
{ "error": "Brief explanation of why this can't be parsed as a geopolitical scenario" }

If the user's message is in a language other than English, please issue your response in that language.

Only return valid JSON, no additional text.`;

    // Add context addendum if US is mentioned
    const promptLower = args.prompt.toLowerCase();
    const usAddendum = (promptLower.includes("united states") || promptLower.includes("america") || promptLower.includes("u.s."))
      ? "\n\nAddendum: Donald Trump won the 2024 Election and is current president of the United States."
      : "";

    const result = await fetchGeminiWithLogging(
      ctx,
      "parseScenarioPrompt",
      systemPrompt + usAddendum,
      args.prompt,
      geminiApiKey,
      false,
      0.7,
      20000,
      SCENARIO_MODEL
    );

    const parsed = JSON.parse(result.content);

    if (parsed.error) {
      return parsed;
    }

    if (!parsed.title || !parsed.sideA || !parsed.sideB) {
      throw new Error("AI returned incomplete response - missing required fields");
    }

    const sanitize = (s: string) => s?.trim().replace(/[\x00-\x1F\x7F]/g, '') || '';

    return {
      title: sanitize(parsed.title),
      description: sanitize(parsed.description || ''),
      primaryActor: parsed.primaryActor ? sanitize(parsed.primaryActor) : undefined,
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

      // Helper to process a single batch, save scores immediately, and return them
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

        // Save scores immediately for real-time map updates
        // Filter out entries with missing or invalid scores (AI sometimes returns malformed data)
        const scoresToSave = Object.entries(batchScores)
          .filter(([, data]) => typeof data.score === 'number' && !isNaN(data.score))
          .map(([countryName, data]) => ({
            countryName,
            score: data.score,
            reasoning: data.reasoning,
          }));

        if (scoresToSave.length > 0) {
          await ctx.runMutation(issuesApi.upsertBatchScores, {
            issueId,
            scores: scoresToSave,
          });
        }

        // Update progress
        completedBatches++;
        const progress = Math.round((completedBatches / totalBatches) * 100);
        await ctx.runMutation(issuesApi.updateJobStatus, {
          jobId,
          completedBatches,
          progress,
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

      // Execute all batches in parallel (use allSettled so one failure doesn't stop others)
      const results = await Promise.allSettled(allBatchPromises);

      // Count failures
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) {
        console.error(`${failures.length} of ${results.length} batches failed`);
      }

      // Activate the issue and mark job complete
      await ctx.runMutation(issuesApi.updateIssueActive, {
        issueId,
        isActive: true,
      });

      // Update embedded scores for bandwidth optimization
      await ctx.runMutation(issuesApi.updateEmbeddedScores, {
        issueId,
      }).catch((err: Error) => console.error("Failed to update embedded scores:", err));

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

// Process scenario batches for an existing issue (for real-time updates)
// Called after initializeScenario mutation, can be fire-and-forget
export const processScenarioBatches = action({
  args: {
    issueId: v.id("issues"),
    jobId: v.id("generationJobs"),
    title: v.string(),
    description: v.string(),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    numRuns: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const numRuns = args.numRuns ?? DEFAULT_NUM_RUNS;

    try {
      // Get active map version
      const mapVersion = await ctx.runQuery(issuesApi.getActiveMapVersion, {}) as MapVersionType | null;
      if (!mapVersion) {
        throw new Error("No active map version found");
      }

      const countries = mapVersion.countries;
      const totalCountries = countries.length;
      const batches = batchArray(countries, BATCH_SIZE);
      const totalBatches = batches.length * numRuns;

      // Track completed batches and countries (across all parallel requests)
      let completedBatches = 0;
      let completedCountries = 0;

      // Helper to process a single batch and save scores immediately
      const processBatch = async (batch: string[]): Promise<void> => {
        const batchScores = await generateScoresForBatchOpenRouter(
          ctx,
          openRouterApiKey,
          args.title,
          args.description,
          args.sideA,
          args.sideB,
          batch,
        );

        // Save scores immediately for real-time map updates
        // Filter out entries with missing or invalid scores (AI sometimes returns malformed data)
        const scoresToSave = Object.entries(batchScores)
          .filter(([, data]) => typeof data.score === 'number' && !isNaN(data.score))
          .map(([countryName, data]) => ({
            countryName,
            score: data.score,
            reasoning: data.reasoning,
          }));

        if (scoresToSave.length > 0) {
          await ctx.runMutation(issuesApi.upsertBatchScores, {
            issueId: args.issueId,
            scores: scoresToSave,
          });
        }

        // Update progress counters
        completedBatches++;
        completedCountries += scoresToSave.length;
        const progress = Math.round((completedBatches / totalBatches) * 100);

        // Cap completedCountries at totalCountries for display purposes
        // (with multiple runs, we score each country multiple times)
        const displayedCountries = Math.min(completedCountries, totalCountries);

        await ctx.runMutation(issuesApi.updateJobStatus, {
          jobId: args.jobId,
          completedBatches,
          completedCountries: displayedCountries,
          progress,
        });
      };

      // Build all batches across all runs
      const allBatches: string[][] = [];
      for (let run = 0; run < numRuns; run++) {
        const shuffledCountries = shuffleArray(countries);
        const runBatches = batchArray(shuffledCountries, BATCH_SIZE);
        allBatches.push(...runBatches);
      }

      // Fire all batches in parallel
      const results = await Promise.allSettled(
        allBatches.map(batch => processBatch(batch))
      );

      // Count failures
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) {
        console.error(`${failures.length} of ${results.length} batches failed`);
        const firstFailure = failures[0] as PromiseRejectedResult;
        console.error("First failure:", firstFailure.reason);
      }

      // Activate the issue and mark job complete (even with partial failures)
      await ctx.runMutation(issuesApi.updateIssueActive, {
        issueId: args.issueId,
        isActive: true,
      });

      // Update embedded scores for bandwidth optimization
      await ctx.runMutation(issuesApi.updateEmbeddedScores, {
        issueId: args.issueId,
      }).catch((err: Error) => console.error("Failed to update embedded scores:", err));

      await ctx.runMutation(issuesApi.updateJobStatus, {
        jobId: args.jobId,
        status: "completed",
        progress: 100,
        completedCountries: totalCountries,
        error: failures.length > 0 ? `${failures.length} batches failed` : undefined,
      });

      return { success: true };
    } catch (error) {
      // Mark job as failed
      await ctx.runMutation(issuesApi.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }).catch(() => {});

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Process headline batches for a headline (for real-time updates on /admin/headlines)
export const processHeadlineBatches = action({
  args: {
    headlineId: v.id("headlines"),
    jobId: v.id("generationJobs"),
    title: v.string(),
    description: v.string(),
    sideA: v.object({ label: v.string(), description: v.string() }),
    sideB: v.object({ label: v.string(), description: v.string() }),
    numRuns: v.optional(v.number()),
    useWebGrounding: v.optional(v.boolean()),
    modelChoice: modelChoiceValidator,
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const numRuns = args.numRuns ?? DEFAULT_NUM_RUNS;
    const batchSize = args.batchSize ?? BATCH_SIZE;

    try {
      // Get active map version
      const mapVersion = await ctx.runQuery(headlinesApi.getActiveMapVersion, {}) as MapVersionType | null;
      if (!mapVersion) {
        throw new Error("No active map version found");
      }

      const countries = mapVersion.countries;
      const totalCountries = countries.length;
      const batches = batchArray(countries, batchSize);
      const totalBatches = batches.length * numRuns;

      // Track completed batches and countries (across all parallel requests)
      let completedBatches = 0;
      let completedCountries = 0;

      const modelChoice = args.modelChoice || "3.0-flash-fallback";

      // Helper to process a single batch and save scores immediately
      const processBatch = async (batch: string[]): Promise<void> => {
        const batchScores = await generateScoresForBatch(
          ctx,
          openaiApiKey,
          args.title,
          args.description,
          args.sideA,
          args.sideB,
          batch,
          args.useWebGrounding,
          modelChoice
        );

        // Save scores immediately for real-time map updates
        const scoresToSave = Object.entries(batchScores)
          .filter(([, data]) => typeof data.score === 'number' && !isNaN(data.score))
          .map(([countryName, data]) => ({
            countryName,
            score: data.score,
            reasoning: data.reasoning,
          }));

        if (scoresToSave.length > 0) {
          await ctx.runMutation(headlinesApi.upsertBatchScores, {
            headlineId: args.headlineId,
            scores: scoresToSave,
          });
        }

        // Update progress counters
        completedBatches++;
        completedCountries += scoresToSave.length;
        const progress = Math.round((completedBatches / totalBatches) * 100);

        // Cap completedCountries at totalCountries for display purposes
        const displayedCountries = Math.min(completedCountries, totalCountries);

        await ctx.runMutation(issuesApi.updateJobStatus, {
          jobId: args.jobId,
          completedBatches,
          completedCountries: displayedCountries,
          progress,
        });
      };

      // Build all batches across all runs
      const allBatches: string[][] = [];
      for (let run = 0; run < numRuns; run++) {
        const shuffledCountries = shuffleArray(countries);
        const runBatches = batchArray(shuffledCountries, batchSize);
        allBatches.push(...runBatches);
      }

      // Fire first batch and wait (establishes cache for implicit caching)
      if (allBatches.length > 0) {
        await processBatch(allBatches[0]);
      }

      // Fire remaining batches - rate limited for 3.0-pro, parallel for others
      const remainingBatches = allBatches.slice(1);
      let results: PromiseSettledResult<void>[];

      if (modelChoice === "3.0-pro" && remainingBatches.length > 0) {
        // Sliding window rate limit: 20 RPM max
        // Fires requests continuously, spaced ~3s apart, without waiting for responses
        results = await processWithRateLimit(remainingBatches, processBatch, 20);
      } else {
        // Non-pro models: fire all in parallel
        results = await Promise.allSettled(
          remainingBatches.map(batch => processBatch(batch))
        );
      }

      // Count failures
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) {
        console.error(`${failures.length} of ${results.length} batches failed`);
        const firstFailure = failures[0] as PromiseRejectedResult;
        console.error("First failure:", firstFailure.reason);
      }

      // Update embedded scores for bandwidth optimization
      await ctx.runMutation(headlinesApi.updateEmbeddedScores, {
        headlineId: args.headlineId,
      }).catch((err: Error) => console.error("Failed to update embedded scores:", err));

      // Mark job complete (headline remains inactive until admin manually activates)

      await ctx.runMutation(issuesApi.updateJobStatus, {
        jobId: args.jobId,
        status: "completed",
        progress: 100,
        completedCountries: totalCountries,
        error: failures.length > 0 ? `${failures.length} batches failed` : undefined,
      });

      return { success: true };
    } catch (error) {
      // Mark job as failed
      await ctx.runMutation(issuesApi.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }).catch(() => {});

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Re-run scores for missing countries in a headline
export const rerunMissingHeadlineScores = action({
  args: {
    headlineId: v.id("headlines"),
    useWebGrounding: v.optional(v.boolean()),
    modelChoice: modelChoiceValidator,
  },
  handler: async (ctx, args): Promise<{ success: boolean; rerunCount: number; error?: string }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    try {
      // Get headline
      const headline = await ctx.runQuery(headlinesApi.getHeadlineById, {
        headlineId: args.headlineId,
      });
      if (!headline) {
        throw new Error("Headline not found");
      }

      // Get missing countries
      const missingResult = await ctx.runQuery(headlinesApi.getMissingCountries, {
        headlineId: args.headlineId,
      }) as { missing: string[]; total: number; scored: number };

      if (missingResult.missing.length === 0) {
        return { success: true, rerunCount: 0 };
      }

      const modelChoice = args.modelChoice || "3.0-flash-fallback";
      const batchSize = BATCH_SIZE;
      const batches = batchArray(missingResult.missing, batchSize);

      let scoredCount = 0;

      // Process first batch and wait (for caching)
      if (batches.length > 0) {
        const firstBatchScores = await generateScoresForBatch(
          ctx,
          openaiApiKey,
          headline.title,
          headline.description,
          headline.sideA,
          headline.sideB,
          batches[0],
          args.useWebGrounding,
          modelChoice
        );

        const scoresToSave = Object.entries(firstBatchScores)
          .filter(([, data]) => typeof data.score === 'number' && !isNaN(data.score))
          .map(([countryName, data]) => ({
            countryName,
            score: data.score,
            reasoning: data.reasoning,
          }));

        if (scoresToSave.length > 0) {
          await ctx.runMutation(headlinesApi.upsertBatchScores, {
            headlineId: args.headlineId,
            scores: scoresToSave,
          });
          scoredCount += scoresToSave.length;
        }
      }

      // Process remaining batches - rate limited for 3.0-pro, parallel for others
      if (batches.length > 1) {
        const remainingBatches = batches.slice(1);

        const processSingleBatch = async (batch: string[]): Promise<number> => {
          const batchScores = await generateScoresForBatch(
            ctx,
            openaiApiKey,
            headline.title,
            headline.description,
            headline.sideA,
            headline.sideB,
            batch,
            args.useWebGrounding,
            modelChoice
          );

          const scoresToSave = Object.entries(batchScores)
            .filter(([, data]) => typeof data.score === 'number' && !isNaN(data.score))
            .map(([countryName, data]) => ({
              countryName,
              score: data.score,
              reasoning: data.reasoning,
            }));

          if (scoresToSave.length > 0) {
            await ctx.runMutation(headlinesApi.upsertBatchScores, {
              headlineId: args.headlineId,
              scores: scoresToSave,
            });
          }

          return scoresToSave.length;
        };

        let results: PromiseSettledResult<number>[];

        if (modelChoice === "3.0-pro") {
          // Sliding window rate limit: 20 RPM max
          const limiter = new RateLimiter(20);
          const promises = remainingBatches.map(async (batch) => {
            await limiter.waitForSlot();
            return processSingleBatch(batch);
          });
          results = await Promise.allSettled(promises);
        } else {
          results = await Promise.allSettled(
            remainingBatches.map(batch => processSingleBatch(batch))
          );
        }

        for (const result of results) {
          if (result.status === "fulfilled") {
            scoredCount += result.value;
          }
        }
      }

      // Update embedded scores for bandwidth optimization
      await ctx.runMutation(headlinesApi.updateEmbeddedScores, {
        headlineId: args.headlineId,
      }).catch((err: Error) => console.error("Failed to update embedded scores:", err));

      return { success: true, rerunCount: scoredCount };
    } catch (error) {
      return {
        success: false,
        rerunCount: 0,
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

    // Accumulate scores across multiple runs (store score with reasoning for median selection)
    const scoreAccumulator: Record<string, { runs: { score: number; reasoning?: string }[] }> = {};
    countries.forEach((country) => {
      scoreAccumulator[country] = { runs: [] };
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

        // Accumulate scores (skip entries with missing/invalid scores)
        for (const [country, data] of Object.entries(batchScores)) {
          if (scoreAccumulator[country] && typeof data.score === 'number' && !isNaN(data.score)) {
            scoreAccumulator[country].runs.push({ score: data.score, reasoning: data.reasoning });
          }
        }
      }
    }

    // Calculate averaged scores, pick reasoning from median run
    const finalScores: CountryScore[] = countries.map((country) => {
      const acc = scoreAccumulator[country];
      if (acc.runs.length === 0) {
        return { countryName: country, score: 0, reasoning: undefined };
      }
      const avgScore = acc.runs.reduce((sum, r) => sum + r.score, 0) / acc.runs.length;
      // Sort by score to find median, pick its reasoning
      const sorted = [...acc.runs].sort((a, b) => a.score - b.score);
      const medianRun = sorted[Math.floor(sorted.length / 2)];
      return {
        countryName: country,
        score: Math.max(-1, Math.min(1, avgScore)), // Clamp to [-1, 1]
        reasoning: medianRun.reasoning,
      };
    });

    // Save scores to database
    await ctx.runMutation(issuesApi.saveCountryScores, {
      issueId: args.issueId,
      scores: finalScores,
    });

    // Update embedded scores for bandwidth optimization
    await ctx.runMutation(issuesApi.updateEmbeddedScores, {
      issueId: args.issueId,
    }).catch((err: Error) => console.error("Failed to update embedded scores:", err));

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
  countries: string[],
  useWebGrounding?: boolean,
  modelChoice?: "2.0-flash" | "2.5-flash" | "3.0-flash" | "3.0-flash-fallback" | "3.0-pro"
): Promise<Record<string, { score: number; reasoning?: string }>> {
  // Static instructions at the start (cacheable across all requests)
  const staticInstructions = `You are an expert geopolitical analyst rating countries' likely positions on geopolitical issues.

Consider these factors when rating:
- Current alliances and treaties
- Economic ties and dependencies
- Ideological alignment
- Historical relationships
- Regional interests
- Domestic political considerations

RATING SCALE (use ONLY these values: -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1):
-  1.0  = Extremely supportive
-  0.75 = Strongly supportive
-  0.5  = Supportive
-  0.25 = Slightly supportive
-  0    = Neutral / No clear position
- -0.25 = Slightly opposed
- -0.5  = Opposed
- -0.75 = Strongly opposed
- -1.0  = Extremely opposed

FORMATTING RULES:
- NEVER use "Side A" or "Side B" in your reasoning
- Use natural language to describe positions. For example, say "leading voice against annexation" rather than "leading Anti-Annexation voice". Describe the stance in plain English rather than inserting stance labels awkwardly.
- Write in a natural, human tone - like a knowledgeable analyst explaining to a colleague, not a formal report. Vary sentence structure, avoid repetitive phrasing, and don't overuse words like "significant", "notable", "robust", or "multifaceted".
- Provide detailed reasoning of 4-6 sentences with a paragraph break
- First paragraph (two or three sentences): Explain the country's official position (if known) or historical stance on similar issues
- Second paragraph (one or two sentences): Analyze the geopolitical factors, alliances, and interests that inform their position
- If you believe their private position is different than their public position, or if they may refrain from a statement due to geopolitical reasons, say so and clearly justify why
- Public statements should take priority over their expected private stance in the scoring, but do consider expected private stances as a factor

Return a JSON object with this exact structure:
{
  "scores": {
    "CountryName": { "score": 0.5, "reasoning": "First paragraph about position...\\n\\nSecond paragraph about factors..." },
    ...
  }
}

Only return valid JSON, no additional text. Country names must match exactly as provided.
If the scenario description is in a language other than English, please issue your response in that language.`;

  // Web grounding instructions (static when enabled)
  const webGroundingInstructions = useWebGrounding ? `

WEB SEARCH INSTRUCTIONS:
You MUST perform exactly ONE web search for EACH country in the batch. Do not skip any countries.

For each country, search: "[country] [topic in 1-3 words] statement 2026"
Examples: "Germany Greenland annexation statement 2026" or "Japan tariffs official statement 2026"

You are looking for any indication of opinion from government leaders - it doesn't need to be an official statement, just any reported position or comment from officials.

If you find statements or reported positions, use those to inform your score and cite them in your reasoning.

If no position is found for a country:
- Say something like (but not exactly) "[Country] has not issued a statement on this issue, but..."
- Justify their expected position based on historical precedent, geopolitical alliances, treaty obligations, regional interests, or past behavior on similar issues
- Lean towards neutral (score closer to 0) when uncertain, but use your geopolitical expertise to make informed predictions when historical patterns are clear` : '';

  // Combine static parts first, then variable scenario details
  const systemPrompt = `${staticInstructions}${webGroundingInstructions}

---

SCENARIO: ${title}
${description}

SUPPORT (positive scores): ${sideA.label} - ${sideA.description}
OPPOSE (negative scores): ${sideB.label} - ${sideB.description}`;

  // Build user prompt with country context if applicable
  const countryContext = buildCountryContext(countries);
  const userPrompt = `Rate these countries: ${countries.join(", ")}${countryContext}`;

  let content!: string; // Assigned in either branch below, or we throw

  // Use Gemini with search grounding when web grounding is enabled
  if (useWebGrounding) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set (required for web grounding)");
    }

    // Determine model version(s) to try
    const effectiveChoice = modelChoice || "3.0-flash-fallback";
    const tryModels: GeminiModelVersion[] = effectiveChoice === "3.0-flash-fallback"
      ? ["3.0-flash", "2.5-flash"]
      : [effectiveChoice as GeminiModelVersion];

    let lastError: Error | null = null;
    for (const modelVersion of tryModels) {
      try {
        const result = await fetchGeminiWithLogging(
          ctx,
          "generateScoresForBatch",
          systemPrompt,
          userPrompt,
          geminiApiKey,
          true, // useSearchGrounding
          0.5,
          60000, // 60 second timeout for search grounding
          modelVersion
        );
        content = result.content;
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.log(`Model ${modelVersion} failed, ${tryModels.indexOf(modelVersion) < tryModels.length - 1 ? 'trying fallback...' : 'no more fallbacks'}`);
        if (tryModels.indexOf(modelVersion) >= tryModels.length - 1) {
          throw lastError;
        }
      }
    }
    if (lastError) throw lastError;
  } else {
    // Use Gemini directly for non-grounded requests (custom scenarios)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    const result = await fetchGeminiWithLogging(
      ctx,
      "generateScoresForBatch",
      systemPrompt,
      userPrompt,
      geminiApiKey,
      false, // no search grounding
      0.5,
      45000, // 45 second timeout
      SCENARIO_MODEL
    );
    content = result.content;
  }

  const parsed = JSON.parse(content);
  return parsed.scores || {};
}

// Scenario-specific batch scoring via OpenRouter (separate from headline scoring)
const SCENARIO_OPENROUTER_MODEL = "google/gemini-2.5-flash-lite-preview-09-2025";

async function generateScoresForBatchOpenRouter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  apiKey: string,
  title: string,
  description: string,
  sideA: { label: string; description: string },
  sideB: { label: string; description: string },
  countries: string[],
): Promise<Record<string, { score: number; reasoning?: string }>> {
  // Same prompt as headline scoring
  const staticInstructions = `You are an expert geopolitical analyst rating countries' likely positions on geopolitical issues.

Consider these factors when rating:
- Current alliances and treaties
- Economic ties and dependencies
- Ideological alignment
- Historical relationships
- Regional interests
- Domestic political considerations

RATING SCALE (use ONLY these values: -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1):
-  1.0  = Extremely supportive
-  0.75 = Strongly supportive
-  0.5  = Supportive
-  0.25 = Slightly supportive
-  0    = Neutral / No clear position
- -0.25 = Slightly opposed
- -0.5  = Opposed
- -0.75 = Strongly opposed
- -1.0  = Extremely opposed

FORMATTING RULES:
- NEVER use "Side A" or "Side B" in your reasoning
- Use natural language to describe positions
- Provide reasoning in 2 concise sentences. Be brief and direct.

Return a JSON object with this exact structure:
{
  "scores": {
    "CountryName": { "score": 0.5, "reasoning": "Brief explanation." },
    ...
  }
}

REMINDER: A score of +1.00 means strong support for "${sideA.label}" and a score of -1.00 means strong support for "${sideB.label}". Make sure your scores align with the correct side.

Only return valid JSON, no additional text. Country names must match exactly as provided.
If the scenario description is in a language other than English, please issue your response in that language.`;

  const systemPrompt = `${staticInstructions}

---

SCENARIO: ${title}
${description}

SUPPORT (positive scores): ${sideA.label} - ${sideA.description}
OPPOSE (negative scores): ${sideB.label} - ${sideB.description}`;

  const countryContext = buildCountryContext(countries);
  const userPrompt = `Rate these countries: ${countries.join(", ")}${countryContext}`;

  const result = await fetchOpenRouterWithLogging(
    ctx,
    "generateScoresForBatch",
    SCENARIO_OPENROUTER_MODEL,
    systemPrompt,
    userPrompt,
    apiKey,
    0.5,
    45000
  );

  const parsed = JSON.parse(result.content);
  return parsed.scores || {};
}

// Generate a fun fact related to the scenario title
export const generateFunFact = action({
  args: {
    title: v.string(),
    previousFacts: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<{ fact: string }> => {
    const openaiApiKey = process.env.OPENROUTER_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    const previousFactsNote = args.previousFacts && args.previousFacts.length > 0
      ? `\n\nPrevious fun facts: ${args.previousFacts.join(" || ")} || New fun facts should touch on a different topic.`
      : "";

    const systemPrompt = `You are a witty trivia expert specializing in history, geopolitics, and international relations. Given a geopolitical scenario title, generate ONE fun, interesting, or surprising fact that MUST be directly related to the scenario's topic.

Rules:
- ACCURACY IS CRITICAL: Only state facts you are confident are true. Do not make up statistics, dates, or claims. If unsure, pick a different fact you know to be accurate.
- The fact MUST relate to the specific scenario topic, countries, regions, or key themes involved - this is non-negotiable
- Prefer facts about history, geopolitics, diplomacy, international relations, treaties, alliances, or historical conflicts
- Keep it brief (1-2 sentences max)
- Make it genuinely interesting or surprising
- Avoid being too serious - aim for "huh, that's interesting!" reactions
- Do NOT start with "Did you know" or similar phrases - just state the fact directly

Return JSON: { "fact": "Your fun fact here" }`;

    const MODEL = "google/gemini-2.0-flash-001";

    try {
      const { content } = await fetchOpenRouterWithLogging(
        ctx,
        "generateFunFact",
        MODEL,
        systemPrompt,
        `Scenario: ${args.title}${previousFactsNote}`,
        openaiApiKey,
        0.9, // High temperature for variety
        10000 // 10 second timeout
      );

      const parsed = JSON.parse(content);
      if (!parsed.fact) {
        return { fact: "" };
      }
      return { fact: parsed.fact };
    } catch (error) {
      // Return empty fact if AI fails - UI will not display it
      return { fact: "" };
    }
  },
});

