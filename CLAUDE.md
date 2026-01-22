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