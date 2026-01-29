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

    // Gather all related data for each issue in parallel
    const issueRelatedData = await Promise.all(
      issues.map(async (issue) => {
        const [scores, jobs] = await Promise.all([
          ctx.db
            .query("countryScores")
            .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
            .collect(),
          ctx.db
            .query("generationJobs")
            .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
            .collect(),
        ]);
        return { issue, scores, jobs };
      })
    );

    // Delete all issue-related records in parallel
    await Promise.all(
      issueRelatedData.flatMap(({ issue, scores, jobs }) => [
        ...scores.map((s) => ctx.db.delete(s._id)),
        ...jobs.map((j) => ctx.db.delete(j._id)),
        ctx.db.delete(issue._id),
      ])
    );

    // Gather remaining user data in parallel
    const [subscription, feedbackResponses, authAccounts, authSessions] =
      await Promise.all([
        ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .first(),
        ctx.db
          .query("feedbackResponses")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect(),
        ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
          .collect(),
        ctx.db
          .query("authSessions")
          .withIndex("userId", (q) => q.eq("userId", args.userId))
          .collect(),
      ]);

    // Delete all user records in parallel
    await Promise.all([
      ...(subscription ? [ctx.db.delete(subscription._id)] : []),
      ...feedbackResponses.map((f) => ctx.db.delete(f._id)),
      ...authAccounts.map((a) => ctx.db.delete(a._id)),
      ...authSessions.map((s) => ctx.db.delete(s._id)),
    ]);

    // Finally, delete the user record
    await ctx.db.delete(args.userId);
  },
});
