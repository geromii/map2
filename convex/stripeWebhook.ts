import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// HTTP handler that receives Stripe webhooks and delegates to an action
export const stripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await request.text();

  try {
    // Delegate to the Node.js action for Stripe processing
    await ctx.runAction(internal.stripeActions.handleWebhook, {
      body,
      signature,
    });
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
