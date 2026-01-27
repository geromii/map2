"use client";

import { useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Title shown on the sign-in prompt */
  title?: string;
  /** Description shown on the sign-in prompt */
  description?: string;
  /** Custom content to show below the sign-in button */
  heroContent?: React.ReactNode;
}

export function RequireAuth({
  children,
  title = "Sign In Required",
  description = "Please sign in to access this page.",
  heroContent,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-48px)] flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-amber-50 px-4 py-12 overflow-y-auto">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-slate-800 bg-clip-text text-transparent mb-4">{title}</h1>
          <p className="text-lg text-slate-600 mb-8">{description}</p>
          <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
            <Button size="lg" className="px-12 py-6 text-lg bg-yellow-400 hover:bg-yellow-500 text-primary border-2 border-primary shadow-[0_4px_12px_rgb(0,0,0,0.35)] rounded-full">
              Sign In to Continue
            </Button>
          </Link>
        </div>
        {heroContent && (
          <div className="mt-12 w-full max-w-5xl">
            {heroContent}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
