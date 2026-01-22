# Global Relations Map - Project Notes

## Color Scheme
- **Primary**: Blue (HSL 222.2 47.4% 11.2%)
- **Secondary**: Yellow (HSL 48 96% 53%)
- Used consistently across buttons, borders, and accents

## Layout Structure
- **Top**: Data update banner (white bg with yellow borders)
- **Stats Section**: Always visible (previously "For/Against")
- **Map**: Interactive world map with country selection
- **Sidebars**: Below map (left: search/random, right: presets)
- **Demographics**: Bottom accordion with blue/yellow styling

## Key UI Fixes
- Map header uses CSS Grid (`grid-cols-[1fr,auto,1fr]`) to keep "vs" centered
- NoCountrySelected divs use `pointer-events-none` when hidden to prevent blocking map clicks
- Long country names truncate with ellipsis to prevent horizontal overflow

## Commands
- Run development: `npm run dev`
- Lint/typecheck commands: Ask user for specific commands if needed

## TypeScript Migration
- New files should be written in TypeScript (.ts/.tsx)
- Existing JavaScript files should be converted to TypeScript when making significant changes to them

## Convex Database Integration

Backend database added via Convex (2026-01-21). Provider set up in `src/app/ConvexClientProvider.tsx`.

### Authentication Setup (2026-01-22)
- **Convex Auth** configured with Email/Password and Google OAuth
- Auth files: `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`
- Schema with auth tables: `convex/schema.ts`
- UI components: `src/components/custom/SignIn.tsx`, `src/components/custom/UserButton.tsx`
- Google OAuth requires environment variables: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

### Feature 1: Daily Geopolitics Headlines (Public)
- **Auth**: No login required (pre-generated data)
- **Goal**: Daily scan for major geopolitics news, generate country positions
- **UX**: User selects from ~4 current major geopolitical issues, sees map for each
- **Process**:
  1. Background job scans news sources daily for geopolitics headlines
  2. AI selects ~4 most significant issues
  3. For each issue, generate for/against scores for every country
  4. Store results in Convex
  5. Frontend displays selectable list of issues with corresponding maps
- **Status**: Planning

### Feature 2: Custom Prompt Scenario Generator (Authenticated)
- **Auth**: Requires login
- **Goal**: Allow users to input custom prompts (e.g., "China invades Taiwan")
- **Process**:
  1. User submits a custom prompt
  2. AI parses the prompt into distinct for/against sides
  3. AI queries each country's likely position on each side
  4. Results displayed on the conflict map
- **Status**: Planning

### Shared AI Map Data Generation Pipeline
Features 1 and 2 use the same underlying pipeline to generate country position data.

**Scoring Modes**:

1. **Basic Binary**: Two opposing sides with scores from -1 to 1
   - Example: "US Annexation of Greenland" → "Supports" vs "Opposes"
   - Score: -1 (strongly opposes) to 1 (strongly supports)
   - Simple two-color gradient visualization

2. **Advanced Multi-Position** (future): Multiple categories that must sum to 1
   - Example with neutral: `{ "Approve": 0.4, "Disapprove": 0.3, "Neutral": 0.3 }`
   - Example multi-party: `{ "USA": 0.5, "China": 0.3, "Russia": 0.1, "Neutral": 0.1 }`
   - Handles complex issues that aren't purely binary
   - AI proposes categories when parsing the issue
   - Map shows dominant position color with intensity based on strength

**Implementation Plan**: Start with Basic Binary mode. Design data structures and APIs with Advanced mode in mind to avoid costly refactors later.

**Generation Modes**:

1. **High-Accuracy Mode** (for current events / Feature 1):
   - Queries AI with web search for each country individually
   - Higher cost but more accurate for breaking news
   - Best for daily headlines where real-time information matters

2. **Batch Mode** (for hypothetical scenarios / Feature 2):
   - Groups countries into batches of ~20 (randomized order)
   - AI returns JSON with justification + score for each country
   - Run 3 times and average results (potentially across different AI models)
   - Lower cost, suitable for non-current-event scenarios