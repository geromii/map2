"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

// Helper to get Stripe instance
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey);
}

// Create a checkout session for a new subscription
export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string | null }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user email
    const user: { email?: string } | null = await ctx.runQuery(
      internal.subscriptions.getUserById,
      { userId }
    );
    if (!user) {
      throw new Error("User not found");
    }

    const stripe = getStripe();

    // Check if user already has a Stripe customer ID
    const existingSubscription: { stripeCustomerId?: string } | null =
      await ctx.runQuery(internal.subscriptions.getSubscriptionByUserIdInternal, {
        userId,
      });

    let customerId: string | undefined;
    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: args.priceId,
          quantity: 1,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    return { url: checkoutSession.url };
  },
});

// Create a portal session to manage subscription
export const createPortalSession = action({
  args: {
    returnUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's subscription to find their Stripe customer ID
    const subscription: { stripeCustomerId?: string } | null = await ctx.runQuery(
      internal.subscriptions.getSubscriptionByUserIdInternal,
      { userId }
    );

    if (!subscription?.stripeCustomerId) {
      throw new Error("No active subscription found");
    }

    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: args.returnUrl,
    });

    return { url: portalSession.url };
  },
});

// Cancel subscription via Stripe API (used during account deletion)
export const cancelSubscription = internalAction({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();

    try {
      await stripe.subscriptions.cancel(args.stripeSubscriptionId);
      return { success: true };
    } catch (error) {
      console.error("Failed to cancel Stripe subscription:", error);
      return { success: false, error: String(error) };
    }
  },
});
