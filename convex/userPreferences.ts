import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getEmailOptInStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      emailOptIn: prefs?.emailOptIn ?? false,
      emailOptInShown: prefs?.emailOptInShown ?? false,
    };
  },
});

export const setEmailOptIn = mutation({
  args: { optIn: v.boolean() },
  handler: async (ctx, { optIn }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (prefs) {
      await ctx.db.patch(prefs._id, { emailOptIn: optIn });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        emailOptIn: optIn,
        emailOptInShown: true,
      });
    }
  },
});

export const markEmailOptInShown = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (prefs) {
      await ctx.db.patch(prefs._id, { emailOptInShown: true });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        emailOptInShown: true,
      });
    }
  },
});
