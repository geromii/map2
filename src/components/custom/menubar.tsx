"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

// Feature flags
const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
const scenariosEnabled = process.env.NEXT_PUBLIC_SCENARIOS_ENABLED === "true";

// Legacy nav items (when scenarios disabled)
const legacyNavItems = [
  { href: "/diplomacy", label: "Single Country", shortLabel: "Single" },
  { href: "/conflict", label: "Conflict Mode", shortLabel: "Conflict" },
];

// New dropdown structure (when scenarios enabled)
interface DropdownItem {
  href: string;
  label: string;
}

interface NavDropdown {
  label: string;
  shortLabel: string;
  items: DropdownItem[];
}

const navDropdowns: NavDropdown[] = [
  {
    label: "Scenarios",
    shortLabel: "Scenarios",
    items: [
      { href: "/headlines", label: "Headlines" },
      { href: "/scenario", label: "Custom" },
    ],
  },
  {
    label: "Global Relations",
    shortLabel: "Relations",
    items: [
      { href: "/diplomacy", label: "Single Country" },
      { href: "/conflict", label: "Conflict" },
    ],
  },
];

function NavDropdownMenu({ dropdown }: { dropdown: NavDropdown }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if any child is active
  const isChildActive = dropdown.items.some((item) => pathname === item.href);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md whitespace-nowrap",
          isChildActive
            ? "bg-yellow-400/15 text-yellow-400"
            : "text-white/70 hover:text-white hover:bg-white/5"
        )}
      >
        <span className="hidden sm:inline">{dropdown.label}</span>
        <span className="sm:hidden">{dropdown.shortLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-primary border border-white/10 rounded-md shadow-lg py-1 z-50">
          {dropdown.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-yellow-400/15 text-yellow-400"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MenuBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <nav className="bg-primary text-primary-foreground border-b-2 border-yellow-400/80">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr,auto,1fr] h-12 items-center">
          {/* Left: Navigation */}
          <div className="flex items-center gap-1 justify-start">
            {scenariosEnabled ? (
              // New dropdown navigation
              navDropdowns.map((dropdown) => (
                <NavDropdownMenu key={dropdown.label} dropdown={dropdown} />
              ))
            ) : (
              // Legacy direct links
              legacyNavItems.map((item) => {
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
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.shortLabel}</span>
                  </Link>
                );
              })
            )}
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
                <>
                  <Link
                    href="/account"
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                      pathname === "/account"
                        ? "bg-yellow-400/15 text-yellow-400"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </>
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
