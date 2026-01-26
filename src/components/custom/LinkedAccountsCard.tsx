"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LinkedAccount {
  provider: string;
  providerAccountId: string;
}

interface LinkedAccountsCardProps {
  accounts: LinkedAccount[];
}

const PROVIDER_INFO: Record<string, { name: string; icon: React.ReactNode }> = {
  google: {
    name: "Google",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  password: {
    name: "Email & Password",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
};

export function LinkedAccountsCard({ accounts }: LinkedAccountsCardProps) {
  // Check which providers are linked
  const linkedProviders = new Set(accounts.map((a) => a.provider));

  const allProviders = ["google", "password"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign-in Methods</CardTitle>
        <CardDescription>
          Ways you can sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {allProviders.map((provider) => {
          const isLinked = linkedProviders.has(provider);
          const info = PROVIDER_INFO[provider] || {
            name: provider,
            icon: null,
          };

          return (
            <div
              key={provider}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="text-slate-600">{info.icon}</div>
                <span className="font-medium">{info.name}</span>
              </div>
              <Badge variant={isLinked ? "default" : "outline"}>
                {isLinked ? "Linked" : "Not linked"}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
