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
}

export function RequireAuth({
  children,
  title = "Sign In Required",
  description = "Please sign in to access this page.",
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
      <div className="h-[calc(100vh-48px)] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{title}</h1>
          <p className="text-slate-600 mb-8">{description}</p>
          <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
            <Button size="lg" className="px-8">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
