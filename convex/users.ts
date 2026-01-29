import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Delete user account and all associated data
export const deleteAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // 1. Get user's subscription
    const subscription = await ctx.runQuery(
      internal.subscriptions.getSubscriptionByUserIdInternal,
      { userId }
    );

    // 2. Cancel Stripe subscription if active
    if (subscription?.stripeSubscriptionId && subscription.status === "active") {
      await ctx.runAction(internal.stripe.cancelSubscription, {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      });
    }

    // 3. Delete all user data
    await ctx.runMutation(internal.users.deleteUserData, { userId });

    return { success: true };
  },
});

// Internal mutation to delete all user data
export const deleteUserData = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Delete user's issues (custom scenarios)
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const issue of issues) {
      // Delete associated country scores
      const scores = await ctx.db
        .query("countryScores")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const score of scores) {
        await ctx.db.delete(score._id);
      }

      // Delete associated generation jobs
      const jobs = await ctx.db
        .query("generationJobs")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const job of jobs) {
        await ctx.db.delete(job._id);
      }

      // Delete the issue itself
      await ctx.db.delete(issue._id);
    }

    // Delete user's subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (subscription) {
      await ctx.db.delete(subscription._id);
    }

    // Delete user's feedback responses
    const feedbackResponses = await ctx.db
      .query("feedbackResponses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const feedback of feedbackResponses) {
      await ctx.db.delete(feedback._id);
    }

    // Delete auth accounts
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Delete auth sessions
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    // Finally, delete the user record
    await ctx.db.delete(args.userId);
  },
});
