"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";

interface Headline {
  _id: Id<"headlines">;
  title: string;
  slug?: string;
  description: string;
  primaryActor?: string;
  sideA: { label: string; description: string };
  sideB: { label: string; description: string };
  generatedAt: number;
  imageId?: Id<"_storage">;
}

// Featured headline card - large with prominent image
function FeaturedHeadlineCard({
  headline,
}: {
  headline: Headline;
}) {
  const imageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline.imageId ? { headlineId: headline._id } : "skip"
  );
  const counts = useQuery(api.headlines.getHeadlineCounts, { headlineId: headline._id });

  const href = headline.slug ? `/headlines/${headline.slug}` : `/headlines`;

  return (
    <Link
      href={href}
      className="w-full text-left rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md flex flex-col border-slate-200 hover:border-slate-300 overflow-hidden"
    >
      {/* Image area - 16:9 aspect ratio */}
      {imageUrl && (
        <div className="relative w-full aspect-video bg-slate-100">
          <Image
            src={imageUrl}
            alt={headline.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h2 className="font-semibold text-slate-900 text-base sm:text-lg leading-snug">
          {headline.title}
        </h2>
        {headline.description && (
          <p className="text-sm sm:text-base text-slate-600 mt-2 line-clamp-3 flex-1">
            {headline.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-sm text-blue-700 font-medium">
              {counts ? counts.sideA : "–"} {headline.sideA.label}
            </span>
          </span>
          <span className="text-slate-400 text-sm">vs</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-red-700 font-medium">
              {counts ? counts.sideB : "–"} {headline.sideB.label}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

// Secondary headline card - compact card for grid layout
function SecondaryHeadlineCard({
  headline,
}: {
  headline: Headline;
}) {
  const imageUrl = useQuery(
    api.headlines.getHeadlineImageUrl,
    headline.imageId ? { headlineId: headline._id } : "skip"
  );
  const counts = useQuery(api.headlines.getHeadlineCounts, { headlineId: headline._id });

  const href = headline.slug ? `/headlines/${headline.slug}` : `/headlines`;

  return (
    <Link
      href={href}
      className="w-full text-left rounded-lg border bg-white shadow-sm transition-all hover:shadow-md flex flex-row border-slate-200 hover:border-slate-300 overflow-hidden h-24"
    >
      {/* Square thumbnail */}
      <div className="relative w-24 h-24 flex-shrink-0 bg-slate-100">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={headline.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        )}
      </div>

      <div className="p-2.5 flex flex-col flex-1 min-w-0 justify-center">
        <h3 className="font-medium text-slate-900 text-sm leading-snug line-clamp-1">
          {headline.title}
        </h3>
        {headline.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {headline.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-blue-600 font-medium truncate">
              {counts ? counts.sideA : "–"} {headline.sideA.label}
            </span>
          </span>
          <span className="text-slate-400">vs</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-600 font-medium truncate">
              {counts ? counts.sideB : "–"} {headline.sideB.label}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HeadlinesPage() {
  // Fetch featured and active headlines
  const featuredHeadlines = useQuery(api.headlines.getFeaturedHeadlines);
  const activeHeadlines = useQuery(api.headlines.getActiveHeadlines);

  // Loading state
  const isLoading = featuredHeadlines === undefined || activeHeadlines === undefined;
  const hasNoHeadlines = !isLoading && (featuredHeadlines?.length || 0) === 0 && (activeHeadlines?.length || 0) === 0;

  return (
    <div className="h-[calc(100vh-48px)] bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Today&apos;s Headlines</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            See how countries position themselves on major world events
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="max-w-6xl mx-auto">
          {isLoading && (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          )}

          {hasNoHeadlines && (
            <div className="p-8 text-center text-slate-500">
              No headlines available yet.
            </div>
          )}

          {/* Featured Headlines - Large cards */}
          {featuredHeadlines && featuredHeadlines.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredHeadlines.map((headline) => (
                <FeaturedHeadlineCard
                  key={headline._id}
                  headline={headline}
                />
              ))}
            </div>
          )}

          {/* Secondary Headlines - Compact grid */}
          {activeHeadlines && activeHeadlines.length > 0 && (
            <div className={(featuredHeadlines?.length || 0) > 0 ? "mt-6" : ""}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">More Headlines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeHeadlines.map((headline) => (
                  <SecondaryHeadlineCard
                    key={headline._id}
                    headline={headline}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
