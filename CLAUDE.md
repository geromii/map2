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

## SEO Migration Plan (URL Structure Change)

### Current Structure
- `/` - Single country mode (current home page)
- `/conflict` - Multi-country mode

### Target Structure
- `/` - Landing page (future)
- `/diplomacy` - Single country mode (moved from home)
- `/conflict` - Multi-country mode (unchanged)

### Migration Strategy (Phased Approach)
1. **Phase 1 - Immediate Actions** ✅ COMPLETED
   - ✅ Created `/diplomacy` page with exact copy of current home page content
   - ✅ Updated all internal navigation links in menubar and 404 page
   - ✅ Updated sitemap.xml to include /diplomacy
   - ✅ Updated canonical URLs in /diplomacy/page.js
   - ✅ Fixed import paths for /diplomacy components
   - ✅ Verified robots.txt and API routes have no URL dependencies

2. **Phase 2 - Redirect Implementation (1-2 weeks after Phase 1)**
   - Implement 301 redirect from `/` to `/diplomacy`
   - Submit changes to Google Search Console
   - Monitor traffic and rankings

3. **Phase 3 - Landing Page Creation (4-6 weeks after Phase 2)**
   - After SEO equity transfers, create new landing page at `/`
   - Remove redirect
   - Landing page can promote both map modes

### Why This Approach
- 301 redirects preserve 90-99% of SEO value
- Phased approach allows monitoring and rollback if needed
- Maintains user experience during transition