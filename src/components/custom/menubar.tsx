"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

const navItems = [
  { href: "/diplomacy", label: "Single Country", shortLabel: "Single" },
  { href: "/conflict", label: "Conflict Mode", shortLabel: "Conflict" },
];

const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

const MenuBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <nav className="bg-primary text-primary-foreground border-b-2 border-yellow-400/80">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr,auto,1fr] h-12 items-center">
          {/* Left: Navigation Links */}
          <div className="flex items-center gap-1 justify-start">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md whitespace-nowrap",
                    isActive
                      ? "bg-yellow-400/15 text-yellow-400"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Desktop label */}
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* Mobile label */}
                  <span className="sm:hidden">{item.shortLabel}</span>
                </Link>
              );
            })}
          </div>

          {/* Center: Logo/Title */}
          <div className="flex justify-center px-2">
            <Link
              href="/"
              className="flex items-center gap-1 font-arvo text-lg sm:text-xl tracking-tight text-white/90 hover:text-yellow-400 transition-colors duration-200 whitespace-nowrap"
            >
              <Globe className="w-5 h-5" />
              <span>Mapdis</span>
            </Link>
          </div>

          {/* Right: Login area */}
          <div className="flex items-center gap-2 justify-end">
            {authEnabled && (
              isLoading ? null : isAuthenticated ? (
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium bg-yellow-400 text-primary rounded-md hover:bg-yellow-300 transition-colors"
                >
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MenuBar;
