"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/diplomacy", label: "Single Country", shortLabel: "Single" },
  { href: "/conflict", label: "Conflict Mode", shortLabel: "Conflict" },
];

const MenuBar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-primary text-primary-foreground border-b-2 border-yellow-400/80">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Left: Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md",
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
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className="flex items-center gap-2 font-arvo text-lg sm:text-xl tracking-tight text-white/90 hover:text-yellow-400 transition-colors duration-200"
            >
              <Globe className="w-5 h-5 hidden sm:block" />
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
