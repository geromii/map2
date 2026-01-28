"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { Newspaper, Sparkles, ArrowRight } from "lucide-react";

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

function FeaturedHeadlineCard({ headline }: { headline: Headline }) {
  const imageUrl = useQuery(api.headlines.getHeadlineImageUrl, { headlineId: headline._id });
  const counts = useQuery(api.headlines.getHeadlineCounts, { headlineId: headline._id });

  const href = headline.slug ? `/headlines/${headline.slug}` : `/headlines`;

  return (
    <Link
      href={href}
      className="group w-full text-left rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-lg flex flex-col border-slate-200 hover:border-[hsl(48,96%,53%)] overflow-hidden"
    >
      <div className="relative w-full aspect-video bg-slate-200">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={headline.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-2">
          {headline.title}
        </h3>
        {headline.description && (
          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 flex-1">
            {headline.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-700 font-medium">
              {counts ? counts.sideA : "–"} {headline.sideA.label}
            </span>
          </span>
          <span className="text-slate-400">vs</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-700 font-medium">
              {counts ? counts.sideB : "–"} {headline.sideB.label}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function NavigationCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="h-full p-5 rounded-xl bg-[hsl(222.2,47.4%,15%)] hover:bg-[hsl(222.2,47.4%,8%)] border border-[hsl(222.2,47.4%,11.2%)]/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-white/10 border border-white/10">
            <Icon className="w-5 h-5 text-[hsl(48,96%,53%)]" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          {description}
        </p>
        <div className="flex items-center text-[hsl(48,96%,53%)] font-medium text-sm gap-1.5">
          <span>{cta}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </div>
    </Link>
  );
}

export function HomeFeaturedHeadlines() {
  const scenariosEnabled = process.env.NEXT_PUBLIC_SCENARIOS_ENABLED === "true";
  const featuredHeadlines = useQuery(
    api.headlines.getFeaturedHeadlines,
    scenariosEnabled ? {} : "skip"
  );

  if (!scenariosEnabled) {
    return null;
  }

  if (featuredHeadlines === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
            <div className="aspect-video bg-slate-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (featuredHeadlines.length === 0) {
    return null;
  }

  // Show up to 2 featured headlines
  const headlines = featuredHeadlines.slice(0, 2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {headlines.map((headline) => (
        <FeaturedHeadlineCard key={headline._id} headline={headline} />
      ))}
    </div>
  );
}

export function HomeNavigationCards() {
  const scenariosEnabled = process.env.NEXT_PUBLIC_SCENARIOS_ENABLED === "true";

  if (!scenariosEnabled) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <NavigationCard
        href="/headlines"
        icon={Newspaper}
        title="Headlines"
        description="Browse AI-analyzed global events with country-by-country breakdowns of international positions."
        cta="View All Headlines"
      />
      <NavigationCard
        href="/scenario"
        icon={Sparkles}
        title="Custom Scenarios"
        description="Create your own geopolitical scenarios and see how countries would likely respond."
        cta="Create Scenario"
      />
    </div>
  );
}
