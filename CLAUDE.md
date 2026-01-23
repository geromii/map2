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

### AI Scenario Generation Pipeline (2026-01-22)

**Status**: Basic implementation complete, behind feature flag.

**Documentation**: See `docs/AI_PIPELINE.md` for full technical details.

**Feature Flags**:
- `NEXT_PUBLIC_SCENARIOS_ENABLED=true` - Shows Scenarios dropdown in menubar
- `OPENROUTER_API_KEY` - Set in Convex for AI generation

**Pages**:
- `/headlines` - Daily AI-generated issues (public) - UI ready, needs data
- `/scenario` - Custom prompt generator (requires auth) - Fully functional

**Key Files**:
- `convex/schema.ts` - Database tables (issues, countryScores, customPrompts, etc.)
- `convex/issues.ts` - Queries and mutations
- `convex/ai.ts` - AI actions (OpenRouter + gpt-oss-120b)
- `src/components/custom/D3ScoreMap.tsx` - d3-geo map component
- `src/app/scenario/page.tsx` - Custom scenario page
- `src/app/headlines/page.tsx` - Headlines page

**Seeding**:
- Run `npx tsx scripts/seed-map-version.ts` to create the initial mapVersion entry
- Required before using the Scenario Generator for the first time

**Future Work**:
- Daily headline generation (scheduled job with news scanning)
- High-accuracy mode with web search for current events
- Advanced multi-position scoring mode