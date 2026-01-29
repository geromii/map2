import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submitFeedback = mutation({
  args: {
    formVersion: v.string(),
    responses: v.any(),
    page: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    await ctx.db.insert("feedbackResponses", {
      userId: userId ?? undefined,
      formVersion: args.formVersion,
      responses: args.responses,
      page: args.page,
      userAgent: args.userAgent,
    });
  },
});

// Admin-only query to list feedback
export const listFeedback = query({
  args: {
    formVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",");
    if (!user?.email || !adminEmails.includes(user.email)) return [];

    if (args.formVersion) {
      return await ctx.db
        .query("feedbackResponses")
        .withIndex("by_version", (q) => q.eq("formVersion", args.formVersion!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("feedbackResponses")
      .order("desc")
      .collect();
  },
});
