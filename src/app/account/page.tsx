"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RequireAuth } from "@/components/custom/RequireAuth";
import { SubscriptionCard } from "@/components/custom/SubscriptionCard";
import { LinkedAccountsCard } from "@/components/custom/LinkedAccountsCard";
import { ChangePasswordCard } from "@/components/custom/ChangePasswordCard";
import { DangerZoneCard } from "@/components/custom/DangerZoneCard";
import { EmailPreferencesCard } from "@/components/custom/EmailPreferencesCard";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AccountPageContent() {
  const subscription = useQuery(api.subscriptions.getSubscription);
  const linkedAccounts = useQuery(api.subscriptions.getLinkedAccounts);
  const userEmail = useQuery(api.subscriptions.getCurrentUserEmail);
  const searchParams = useSearchParams();

  const showSuccessMessage = searchParams.get("success") === "true";

  const isLoading =
    subscription === undefined ||
    linkedAccounts === undefined ||
    userEmail === undefined;

  return (
    <RequireAuth
      title="Account Settings"
      description="Manage your account, subscription, and preferences. Sign in to access your account settings."
    >
      <div className="min-h-[calc(100vh-48px)] bg-slate-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Account</h1>
            {userEmail && (
              <p className="text-slate-600 mt-1">{userEmail}</p>
            )}
          </div>

          {/* Success message */}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Your subscription has been updated successfully.
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              {/* Skeleton loading states */}
              <div className="bg-white rounded-xl border shadow p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-6" />
                <div className="space-y-3">
                  <div className="h-10 bg-slate-200 rounded" />
                  <div className="h-10 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="bg-white rounded-xl border shadow p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Card */}
              {subscription && (
                <SubscriptionCard subscription={subscription} />
              )}

              {/* Linked Accounts Card */}
              {linkedAccounts && (
                <LinkedAccountsCard accounts={linkedAccounts} />
              )}

              {/* Email Preferences */}
              <EmailPreferencesCard />

              {/* Change Password (only for password accounts) */}
              {linkedAccounts &&
                userEmail &&
                linkedAccounts.some((a) => a.provider === "password") && (
                  <ChangePasswordCard email={userEmail} />
                )}

              {/* Danger Zone */}
              <DangerZoneCard />
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500">Loading...</div>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
