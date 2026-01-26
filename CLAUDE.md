# Global Relations Map - Project Notes

## SEO Priority
- **SEO is a major priority** for this project
- All pages should have proper metadata (title, description, OpenGraph, Twitter cards)
- Use semantic HTML and proper heading hierarchy
- Ensure pages are server-rendered where possible for better crawlability

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
- `OPENROUTER_API_KEY` - Set in Convex for AI generation (non-grounded requests)
- `GEMINI_API_KEY` - Set in Convex for Google Gemini API with search grounding (web grounding enabled)

**Pages**:
- `/headlines` - Daily AI-generated issues (public) - UI ready, needs data
- `/scenario` - Custom prompt generator (requires auth) - Fully functional

**Key Files**:
- `convex/schema.ts` - Database tables (issues, countryScores, headlines, etc.)
- `convex/issues.ts` - Queries and mutations
- `convex/ai.ts` - AI actions (OpenRouter for non-grounded, Google Gemini 3 Flash for web grounded)
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

### Stripe Subscription Integration (2026-01-26)

**Status**: Basic implementation complete.

**Tiers**: Free, Basic, Pro, Advanced

**Feature Flag**:
- `NEXT_PUBLIC_STRIPE_ENABLED=true` - Enables subscription management UI (shows "Coming Soon" when disabled/not set)

**Environment Variables** (set in Convex dashboard):
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret for verifying Stripe events

**Pages**:
- `/account` - Account management page (requires auth)
  - Subscription status and management
  - Linked sign-in methods display
  - Account deletion

**Key Files**:
- `convex/schema.ts` - `subscriptions` table
- `convex/subscriptions.ts` - Subscription queries and mutations
- `convex/stripe.ts` - Stripe checkout and portal session actions
- `convex/stripeWebhook.ts` - Webhook handler for Stripe events
- `convex/users.ts` - Account deletion action
- `src/app/account/page.tsx` - Account management UI
- `src/components/custom/SubscriptionCard.tsx` - Subscription display/management
- `src/components/custom/LinkedAccountsCard.tsx` - Auth providers display
- `src/components/custom/DangerZoneCard.tsx` - Account deletion with confirmation

**Stripe Setup**:
1. Create products in Stripe: Basic, Pro, Advanced
2. Configure Customer Portal in Stripe Dashboard
3. Set up webhook endpoint: `https://<convex-url>/stripe/webhook`
4. Webhook events handled: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`