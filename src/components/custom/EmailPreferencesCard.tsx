"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmailPreferencesCard() {
  const prefs = useQuery(api.userPreferences.getEmailOptInStatus);
  const setEmailOptIn = useMutation(api.userPreferences.setEmailOptIn);

  if (prefs == null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Manage your email communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.emailOptIn}
            onChange={(e) => setEmailOptIn({ optIn: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">
            Receive product update emails
          </span>
        </label>
      </CardContent>
    </Card>
  );
}
