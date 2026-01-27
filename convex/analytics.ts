import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record a country click (updates both country count and session count)
export const recordCountryClick = mutation({
  args: {
    country: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update country click count
    const existingCountry = await ctx.db
      .query("countryClickCounts")
      .withIndex("by_country", (q) => q.eq("country", args.country))
      .first();

    if (existingCountry) {
      await ctx.db.patch(existingCountry._id, {
        clicks: existingCountry.clicks + 1,
      });
    } else {
      await ctx.db.insert("countryClickCounts", {
        country: args.country,
        clicks: 1,
      });
    }

    // Update session click count
    const existingSession = await ctx.db
      .query("clickSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        clickCount: existingSession.clickCount + 1,
        lastClickAt: now,
      });
    } else {
      await ctx.db.insert("clickSessions", {
        sessionId: args.sessionId,
        clickCount: 1,
        firstClickAt: now,
        lastClickAt: now,
      });
    }
  },
});

// Get top clicked countries
export const getTopCountries = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const countries = await ctx.db.query("countryClickCounts").collect();

    return countries
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  },
});

// Get session click distribution (how many sessions had 1 click, 2 clicks, etc.)
export const getSessionDistribution = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("clickSessions").collect();

    const distribution: Record<number, number> = {};
    let totalSessions = 0;
    let totalClicks = 0;

    for (const session of sessions) {
      const count = session.clickCount;
      distribution[count] = (distribution[count] || 0) + 1;
      totalSessions++;
      totalClicks += count;
    }

    return {
      distribution,
      totalSessions,
      totalClicks,
      averageClicksPerSession: totalSessions > 0 ? totalClicks / totalSessions : 0,
    };
  },
});
