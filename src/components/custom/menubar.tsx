"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, ChevronDown, CircleUser, Settings, LogOut, Menu, X } from "lucide-react";
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

// All navigation items flattened for mobile menu
const allNavItems = scenariosEnabled
  ? [
      { href: "/headlines", label: "Headlines", section: "Scenarios" },
      { href: "/scenario", label: "Custom Scenario", section: "Scenarios" },
      { href: "/diplomacy", label: "Single Country", section: "Global Relations" },
      { href: "/conflict", label: "Conflict Mode", section: "Global Relations" },
    ]
  : [
      { href: "/diplomacy", label: "Single Country" },
      { href: "/conflict", label: "Conflict Mode" },
    ];

function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  onSignOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div className="absolute top-0 left-0 w-72 h-full bg-primary shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-arvo text-lg text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "block px-4 py-3 rounded-md text-sm font-medium transition-colors",
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
        </nav>

        {/* Account section */}
        {authEnabled && (
          <div className="border-t border-white/10 p-4 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    pathname === "/account"
                      ? "bg-yellow-400/15 text-yellow-400"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Account
                </Link>
                <button
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="block px-4 py-3 rounded-md text-sm font-medium bg-yellow-400 text-primary hover:bg-yellow-300 transition-colors text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountMenu({ onSignOut }: { onSignOut: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const isAccountActive = pathname === "/account";

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
          "flex items-center justify-center transition-all duration-200",
          isOpen || isAccountActive
            ? "text-yellow-400"
            : "text-white hover:text-yellow-400"
        )}
        aria-label="Account menu"
      >
        <CircleUser className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 min-w-[160px] bg-primary border border-white/10 rounded-md shadow-lg py-1 z-50">
          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
              isAccountActive
                ? "bg-yellow-400/15 text-yellow-400"
                : "text-white/70 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-4 h-4" />
            Account
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const MenuBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="bg-primary text-primary-foreground border-b-2 border-yellow-400/80">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[1fr,auto,1fr] h-12 items-center">
            {/* Left: Hamburger (mobile) / Navigation (desktop) */}
            <div className="flex items-center gap-1 justify-start">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop navigation */}
              <div className="hidden md:flex items-center gap-1">
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
                        {item.label}
                      </Link>
                    );
                  })
                )}
              </div>
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

            {/* Right: Account menu (desktop) / Account button (mobile) */}
            <div className="flex items-center justify-end">
              {authEnabled && !isLoading && (
                <>
                  {/* Desktop account menu */}
                  <div className="hidden md:block">
                    {isAuthenticated ? (
                      <AccountMenu onSignOut={() => signOut()} />
                    ) : (
                      <Link
                        href="/login"
                        className="px-3 py-1.5 text-sm font-medium bg-yellow-400 text-primary rounded-md hover:bg-yellow-300 transition-colors"
                      >
                        Sign In
                      </Link>
                    )}
                  </div>

                  {/* Mobile account button */}
                  <div className="md:hidden">
                    {isAuthenticated ? (
                      <Link
                        href="/account"
                        className={cn(
                          "flex items-center justify-center transition-all duration-200",
                          pathname === "/account"
                            ? "text-yellow-400"
                            : "text-white hover:text-yellow-400"
                        )}
                      >
                        <CircleUser className="w-6 h-6" />
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        className="px-3 py-1.5 text-sm font-medium bg-yellow-400 text-primary rounded-md hover:bg-yellow-300 transition-colors"
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        onSignOut={() => signOut()}
      />
    </>
  );
};

export default MenuBar;
