"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { Id } from "./_generated/dataModel";

// Helper to get Stripe instance
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey);
}

// Map Stripe subscription status to our status
function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" | "free" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
    default:
      return "canceled";
  }
}

// Extract plan ID from price metadata or price ID
function extractPlanId(subscription: Stripe.Subscription): string | undefined {
  const item = subscription.items.data[0];
  if (!item) return undefined;

  // Try to get plan ID from price metadata
  const price = item.price;
  if (price.metadata?.planId) {
    return price.metadata.planId;
  }

  // Fall back to looking up by price ID (basic, pro, advanced based on price)
  const priceId = price.id;
  if (priceId.includes("basic")) return "basic";
  if (priceId.includes("pro")) return "pro";
  if (priceId.includes("advanced")) return "advanced";

  return price.nickname?.toLowerCase() || undefined;
}

// Internal action to handle Stripe webhooks (called from httpAction)
export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        args.body,
        args.signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new Error("Invalid signature");
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get the subscription details
        if (session.subscription && session.customer) {
          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const subscription =
            subscriptionResponse as unknown as Stripe.Subscription;
          const userId = session.metadata?.userId;

          if (userId) {
            const currentPeriodEnd = (
              subscription as Stripe.Subscription & {
                current_period_end: number;
              }
            ).current_period_end;

            await ctx.runMutation(
              internal.subscriptions.createOrUpdateSubscription,
              {
                userId: userId as Id<"users">,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                status: mapStripeStatus(subscription.status),
                planId: extractPlanId(subscription),
                currentPeriodEnd: currentPeriodEnd * 1000,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              }
            );
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;
        const currentPeriodEnd = subscription.current_period_end as number;

        if (userId) {
          await ctx.runMutation(
            internal.subscriptions.createOrUpdateSubscription,
            {
              userId: userId as Id<"users">,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              status: mapStripeStatus(subscription.status),
              planId: extractPlanId(subscription),
              currentPeriodEnd: currentPeriodEnd * 1000,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            }
          );
        } else {
          // Try to update by Stripe subscription ID if no userId in metadata
          await ctx.runMutation(
            internal.subscriptions.updateSubscriptionByStripeId,
            {
              stripeSubscriptionId: subscription.id,
              status: mapStripeStatus(subscription.status),
              currentPeriodEnd: currentPeriodEnd * 1000,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const currentPeriodEnd = subscription.current_period_end as number;

        await ctx.runMutation(
          internal.subscriptions.updateSubscriptionByStripeId,
          {
            stripeSubscriptionId: subscription.id,
            status: "canceled",
            currentPeriodEnd: currentPeriodEnd * 1000,
            cancelAtPeriodEnd: true,
          }
        );
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          await ctx.runMutation(
            internal.subscriptions.updateSubscriptionByStripeId,
            {
              stripeSubscriptionId: invoice.subscription as string,
              status: "past_due",
            }
          );
        }
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }
  },
});
