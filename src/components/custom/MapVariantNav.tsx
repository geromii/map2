"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mapVariants = [
  {
    href: "/diplomacy",
    label: "Diplomacy & Global Relations",
    shortLabel: "Diplomacy",
  },
  {
    href: "/conflict",
    label: "Conflict & Geopolitics",
    shortLabel: "Conflict",
  },
  {
    href: "/ww3",
    label: "World War 3",
    shortLabel: "WW3",
  },
];

export function MapVariantNav() {
  const pathname = usePathname();

  const getActiveVariant = () => {
    return mapVariants.find((v) => pathname.startsWith(v.href));
  };

  const activeVariant = getActiveVariant();

  return (
    <nav
      className="flex justify-center gap-1 sm:gap-2 py-2 px-4 bg-white border-b border-gray-200"
      aria-label="Map variations"
    >
      {mapVariants.map((variant) => {
        const isActive = activeVariant?.href === variant.href;
        return (
          <Link
            key={variant.href}
            href={variant.href}
            className={cn(
              "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200",
              isActive
                ? "bg-yellow-400 text-primary shadow-sm"
                : "text-primary/70 hover:text-primary hover:bg-primary/5 border border-primary/20"
            )}
          >
            <span className="hidden sm:inline">{variant.label}</span>
            <span className="sm:hidden">{variant.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
