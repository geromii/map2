"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/diplomacy", label: "Single Country", shortLabel: "Single" },
  { href: "/conflict", label: "Conflict Mode", shortLabel: "Conflict" },
];

const MenuBar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors rounded-md",
                    "hover:bg-white/10",
                    isActive && "text-yellow-400"
                  )}
                >
                  {/* Desktop label */}
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* Mobile label */}
                  <span className="sm:hidden">{item.shortLabel}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-yellow-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Center: Logo/Title */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="font-arvo text-lg sm:text-xl tracking-tight hover:text-yellow-400 transition-colors">
              <span className="hidden sm:inline">Global Relations Map</span>
              <span className="sm:hidden">Mapdis</span>
            </Link>
          </div>

          {/* Right: Login area (hidden for now) */}
          <div className="flex items-center gap-2 min-w-[80px] justify-end">
            {/* Login button will go here */}
            {/* <button className="px-4 py-2 text-sm font-medium bg-yellow-400 text-primary rounded-md hover:bg-yellow-300 transition-colors">
              Sign In
            </button> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MenuBar;
