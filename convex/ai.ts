import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

// Store api reference to avoid deep type instantiation in actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const issuesApi = api.issues as any;

// Batch size for country grouping
const BATCH_SIZE = 20;
const NUM_RUNS = 3; // Number of runs to average

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
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }

    const systemPrompt = `You are an expert at analyzing geopolitical scenarios. Given a user prompt describing a scenario or issue, parse it into a structured format with two opposing sides.

Return a JSON object with:
- title: A concise title for the issue (max 100 chars)
- description: A brief description of the overall scenario (1-2 sentences)
- sideA: The side that supports/approves/is in favor (object with "label" and "description")
- sideB: The side that opposes/disapproves/is against (object with "label" and "description")

For example, if the prompt is "US annexation of Greenland", you might return:
{
  "title": "US Annexation of Greenland",
  "description": "The potential acquisition of Greenland by the United States.",
  "sideA": { "label": "Supports", "description": "Countries that would support or approve of US annexation of Greenland" },
  "sideB": { "label": "Opposes", "description": "Countries that would oppose or disapprove of US annexation of Greenland" }
}

Only return valid JSON, no additional text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: args.prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return JSON.parse(content);
  },
});

// Generate batch scores for an issue (batch mode for hypotheticals)
export const generateBatchScores = action({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; scoreCount: number }> => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
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
    for (let run = 0; run < NUM_RUNS; run++) {
      const shuffledCountries = shuffleArray(countries);
      const batches = batchArray(shuffledCountries, BATCH_SIZE);

      for (const batch of batches) {
        const batchScores = await generateScoresForBatch(
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

Only return valid JSON, no additional text. Country names must match exactly as provided.`;

  const userPrompt = `Rate these countries: ${countries.join(", ")}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content);
  return parsed.scores || {};
}

// Helper function to parse prompt to sides (for internal use)
async function parsePromptToSidesInternal(
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

For example, if the prompt is "US annexation of Greenland", you might return:
{
  "title": "US Annexation of Greenland",
  "description": "The potential acquisition of Greenland by the United States.",
  "sideA": { "label": "Supports", "description": "Countries that would support or approve of US annexation of Greenland" },
  "sideB": { "label": "Opposes", "description": "Countries that would oppose or disapprove of US annexation of Greenland" }
}

Only return valid JSON, no additional text.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return JSON.parse(content);
}

// Process a custom prompt end-to-end
export const processCustomPrompt = action({
  args: {
    promptId: v.id("customPrompts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; issueId?: string; error?: string }> => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
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
      const parsedIssue = await parsePromptToSidesInternal(openaiApiKey, prompt.prompt);

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
      for (let run = 0; run < NUM_RUNS; run++) {
        const shuffledCountries = shuffleArray(countries);
        const batches = batchArray(shuffledCountries, BATCH_SIZE);

        for (const batch of batches) {
          const batchScores = await generateScoresForBatch(
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
