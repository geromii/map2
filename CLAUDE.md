# Global Relations Map - Project Notes

## Next.js + Convex Patterns

### Data Fetching Strategy
We use a hybrid approach optimized for both SEO and fast navigation:

**List Pages (e.g., `/headlines`):**
- Server Component with `preloadQuery` from `convex/nextjs`
- Data is fetched server-side and included in initial HTML
- Client component receives preloaded data via `usePreloadedQuery`
- Provides SEO benefits and fast first load

**Detail Pages (e.g., `/headlines/[slug]`):**
- `generateMetadata` for SEO (title, description, og:image) - runs server-side
- Page content renders client-side with `useQuery` - uses prefetched Convex cache
- Prefetching on list page populates client cache for instant navigation

**Why not full SSR for detail pages?**
- SSR runs on server which has no access to client's Convex cache
- Each SSR request makes fresh network calls to Convex (slow)
- Client-side rendering uses already-prefetched data (instant)

### Prefetching Pattern
On list pages, prefetch data needed by detail pages:
```tsx
// In list item component
useQuery(api.headlines.getHeadlineBySlug, { slug: headline.slug });
useQuery(api.headlines.getHeadlineScoresForMap, { headlineId: headline._id });
```
This populates the Convex client cache so navigation is instant.

### Key Files
- `src/app/headlines/page.tsx` - Server Component with preloadQuery
- `src/app/headlines/HeadlinesClient.tsx` - Client component with prefetching
- `src/app/headlines/[slug]/page.tsx` - generateMetadata + client component
- `src/app/headlines/[slug]/HeadlineDetailClient.tsx` - Client-side detail view

## SEO Implementation
- **Meta tags**: Use `generateMetadata` in page.tsx for dynamic SEO
- **OpenGraph/Twitter cards**: Include images where available
- **List pages**: SSR with ISR (`revalidate = 60`) - new content appears within a minute
- **Detail pages**: Meta tags with ISR (`revalidate = 300`), content client-rendered via Convex

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