# AI Map Data Generation Pipeline

## Overview

AI-generated country position scoring for geopolitical scenarios. Two features share the same pipeline:
- **Feature 1**: Daily geopolitics headlines (public, pre-generated)
- **Feature 2**: Custom prompts (authenticated, on-demand)

**Current Status**: Basic implementation complete, behind feature flag.

## Feature Flags

| Flag | Purpose |
|------|---------|
| `NEXT_PUBLIC_SCENARIOS_ENABLED` | Shows Scenarios dropdown in menubar |
| `NEXT_PUBLIC_AUTH_ENABLED` | Shows auth UI in menubar |

## Environment Variables (Convex)

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API access for AI generation |

## Architecture

### Scoring Mode: Basic Binary

Two opposing sides with scores from -1 to 1:
- `-1.0` = Strongly supports Side B
- `0.0` = Neutral
- `+1.0` = Strongly supports Side A

Color mapping: Blue (positive/Side A) ↔ Gray (neutral) ↔ Red (negative/Side B)

### Generation Mode: Batch

1. Get 201 countries from map version
2. Split into batches of ~20 (randomized order)
3. For each batch, call AI with structured JSON output
4. Run 3 times total, average results
5. Save to `countryScores` table

## Database Schema (Convex)

### Tables

```
mapVersions
├── version: string (e.g., "2025-01")
├── topojsonFile: string
├── countriesFile: string
├── countryCount: number
├── countries: string[]
├── createdAt: number
└── isActive: boolean

issues
├── title: string
├── description: string
├── sideA: { label, description }
├── sideB: { label, description }
├── mapVersionId: Id<mapVersions>
├── generatedAt: number
├── isActive: boolean
└── source: "daily" | "custom"

countryScores
├── issueId: Id<issues>
├── countryName: string
├── score: float64 (-1 to 1)
└── reasoning: string?

customPrompts
├── userId: string
├── prompt: string
├── issueId: Id<issues>?
├── status: "pending" | "processing" | "completed" | "failed"
├── createdAt: number
└── error: string?

generationJobs
├── issueId: Id<issues>
├── status: "pending" | "running" | "completed" | "failed"
├── progress: number?
├── startedAt: number?
└── completedAt: number?
```

## API (Convex Functions)

### Queries (`convex/issues.ts`)
- `getActiveIssues()` - Fetch current active issues
- `getIssueScores(issueId)` - Get all country scores for an issue
- `getIssueById(issueId)` - Get issue details
- `getActiveMapVersion()` - Get current map version
- `getUserPrompts()` - User's prompt history (authenticated)
- `getMapVersionById(mapVersionId)` - Get map version by ID

### Mutations (`convex/issues.ts`)
- `createIssue(data)` - Create new issue record
- `saveCountryScores(issueId, scores[])` - Bulk save scores
- `submitCustomPrompt(prompt)` - Start custom prompt flow (authenticated)
- `updatePromptStatus(promptId, status)` - Track processing state
- `createMapVersion(data)` - Seed map version data

### Actions (`convex/ai.ts`)
- `parsePromptToSides(prompt)` - Convert prompt to Side A / Side B
- `generateBatchScores(issueId)` - Batch mode scoring
- `processCustomPrompt(promptId)` - Orchestrates full custom prompt flow

## Frontend Pages

### `/headlines` (Public)
- Two-column layout: sidebar with issue list, main area with map
- Uses `D3ScoreMap` component with d3-geo
- Fetches active daily issues from Convex

### `/scenario` (Authenticated)
- Prompt input at top
- Map displays results after generation
- Requires sign-in (redirects to login)

## Components

### `D3ScoreMap` (`src/components/custom/D3ScoreMap.tsx`)
- Direct d3-geo + topojson rendering (not React Simple Maps)
- Natural Earth projection
- Score-to-color with exponential intensity curve
- Hover callbacks for tooltips
- Responsive sizing

### Supporting Components
- `ScoreLegend` - Color gradient legend
- `CountryTooltip` - Hover tooltip with score and reasoning

## AI Provider

Currently using **OpenRouter** with `openai/gpt-oss-120b` model.

API endpoint: `https://openrouter.ai/api/v1/chat/completions`

### Prompt Structure (Batch Scoring)
```
SCENARIO: {issue title}
{description}

SIDE A ({label}): {description} → positive scores (0 to 1)
SIDE B ({label}): {description} → negative scores (-1 to 0)

Rate each country from -1 to 1. Consider:
- Current alliances and treaties
- Economic ties and dependencies
- Ideological alignment
- Historical relationships
- Regional interests

Countries: {batch of 20}

Return JSON: { "scores": { "CountryName": { "score": 0.5, "reasoning": "..." }, ... } }
```

## Setup Instructions

### 1. Enable Feature Flag
Add to `.env.local`:
```
NEXT_PUBLIC_SCENARIOS_ENABLED=true
```

### 2. Set Convex Environment Variable
```bash
npx convex env set OPENROUTER_API_KEY "your-key-here"
```

### 3. Seed Map Version
Run the `createMapVersion` mutation with country list from `src/app/countries.json`.

### 4. Test
1. Visit `/scenario` (must be logged in)
2. Enter a scenario like "US annexation of Greenland"
3. Wait for generation (~30-60 seconds)
4. See colored map with country positions

## Future Enhancements

- [ ] Daily headline generation (scheduled job)
- [ ] High-accuracy mode with web search for current events
- [ ] Advanced multi-position scoring mode
- [ ] User history and saved scenarios
- [ ] Share scenario URLs
