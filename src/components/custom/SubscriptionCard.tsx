"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Feature flag for Stripe integration
const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

interface Subscription {
  status: "active" | "canceled" | "past_due" | "trialing" | "free";
  planId?: string | null;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionCardProps {
  subscription: Subscription;
}

const PLAN_NAMES: Record<string, string> = {
  basic: "Basic",
  pro: "Pro",
  advanced: "Advanced",
};

const STATUS_BADGES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  trialing: { label: "Trial", variant: "secondary" },
  canceled: { label: "Canceled", variant: "outline" },
  past_due: { label: "Past Due", variant: "destructive" },
  free: { label: "Free", variant: "outline" },
};

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const createPortalSession = useAction(api.stripe.createPortalSession);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { url } = await createPortalSession({
        returnUrl: window.location.href,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create portal session:", error);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/account?success=true`,
        cancelUrl: `${window.location.origin}/account`,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show "Coming Soon" when Stripe is disabled
  if (!stripeEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription</CardTitle>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Current Plan</span>
            <span className="font-medium">Free</span>
          </div>
          <div className="mt-4 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg text-center">
            Premium subscription plans are coming soon. Stay tuned for updates!
          </div>
        </CardContent>
      </Card>
    );
  }

  const planName = subscription.planId
    ? PLAN_NAMES[subscription.planId] || subscription.planId
    : "Free";

  const statusBadge = STATUS_BADGES[subscription.status] || STATUS_BADGES.free;

  const renewalDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const isFree = subscription.status === "free";
  const hasActiveSubscription = ["active", "trialing"].includes(subscription.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscription</CardTitle>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
        <CardDescription>Manage your subscription plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-600">Current Plan</span>
          <span className="font-medium">{planName}</span>
        </div>

        {renewalDate && !subscription.cancelAtPeriodEnd && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Renews On</span>
            <span className="font-medium">{renewalDate}</span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && renewalDate && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Access Until</span>
            <span className="font-medium text-amber-600">{renewalDate}</span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            Your subscription has been canceled and will end on {renewalDate}.
            You can resubscribe at any time.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {hasActiveSubscription && (
            <Button
              onClick={handleManageSubscription}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Manage Subscription"}
            </Button>
          )}

          {isFree && (
            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm text-slate-600 mb-2">
                Upgrade to unlock premium features:
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpgrade("price_basic")}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Basic
                </Button>
                <Button
                  onClick={() => handleUpgrade("price_pro")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Pro
                </Button>
                <Button
                  onClick={() => handleUpgrade("price_advanced")}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Advanced
                </Button>
              </div>
            </div>
          )}

          {subscription.status === "canceled" && !subscription.cancelAtPeriodEnd && (
            <Button
              onClick={() => handleUpgrade("price_basic")}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Resubscribe"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
