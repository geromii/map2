import React from "react";
import Link from "next/link";
import { Globe, Swords, MapPin, Users, BarChart3, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Mapdis - Interactive Global Relations & Conflict Map",
  description: "Explore geopolitics and diplomacy with interactive maps. Visualize international relations, diplomatic ties, alliances, and global conflicts. Understand world politics through data-driven visualization.",
  keywords: "geopolitics map, diplomacy map, world map, international relations, global conflicts, alliance map, political map, interactive map, world politics",
  alternates: {
    canonical: "https://www.mapdis.com",
  },
  openGraph: {
    title: "Mapdis - Interactive Global Relations & Conflict Map",
    description: "Explore geopolitics and diplomacy with interactive maps. Visualize international relations, alliances, and global conflicts.",
    url: "https://www.mapdis.com",
    siteName: "Mapdis",
    images: [{
      url: "https://www.mapdis.com/singleimage.png",
      width: 800,
      height: 600,
      alt: "Mapdis - Interactive Global Relations Map",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mapdis - Interactive Global Relations & Conflict Map",
    description: "Explore geopolitics and diplomacy with interactive maps. Visualize international relations and global conflicts.",
    images: ["https://www.mapdis.com/singleimage.png"],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(222.2,47.4%,11.2%)] relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[hsl(48,96%,53%)] rounded-full opacity-[0.03] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full opacity-[0.05] blur-3xl pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-8">
          <div className="max-w-5xl w-full">
            {/* Logo & Title */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-[hsl(48,96%,53%)] rounded-full animate-pulse" />
                <span className="text-sm text-gray-400 tracking-wide">Visualize Global Geopolitics</span>
              </div>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl text-white tracking-tight font-arvo font-medium mb-6">
                Mapdis
              </h1>
              <p className="text-xl sm:text-2xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                Explore international relations and conflicts through
                <span className="text-[hsl(48,96%,53%)]"> interactive data visualization</span>
              </p>
            </div>

            {/* Mode Cards */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-16">
              {/* Diplomacy Card */}
              <Link href="/diplomacy" className="group">
                <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-[hsl(48,96%,53%)]/50 transition-colors duration-300 overflow-hidden">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-[hsl(48,96%,53%)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-[hsl(222.2,47.4%,15%)] border border-white/10 group-hover:border-[hsl(48,96%,53%)]/30 transition-colors">
                        <Globe className="w-8 h-8 text-[hsl(48,96%,53%)]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Diplomacy Mode</h2>
                        <p className="text-sm text-gray-500">Country-by-country analysis</p>
                      </div>
                    </div>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                      Select any country to explore its relationships with every nation. Discover allies, rivals, and neutral stances on an interactive world map.
                    </p>

                    <div className="flex items-center text-[hsl(48,96%,53%)] font-semibold gap-2">
                      <span>Explore Countries</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Conflict Card */}
              <Link href="/conflict" className="group">
                <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-[hsl(48,96%,53%)]/50 transition-colors duration-300 overflow-hidden">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-[hsl(48,96%,53%)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-[hsl(222.2,47.4%,15%)] border border-white/10 group-hover:border-[hsl(48,96%,53%)]/30 transition-colors">
                        <Swords className="w-8 h-8 text-[hsl(48,96%,53%)]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Conflict Mode</h2>
                        <p className="text-sm text-gray-500">Multi-nation scenarios</p>
                      </div>
                    </div>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                      Define opposing sides of a hypothetical conflict and visualize predicted global alliances. See which countries would support each faction.
                    </p>

                    <div className="flex items-center text-[hsl(48,96%,53%)] font-semibold gap-2">
                      <span>View Conflicts</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 lg:gap-8 max-w-3xl mx-auto">
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3">
                  <MapPin className="w-5 h-5 text-[hsl(48,96%,53%)]" />
                </div>
                <p className="text-sm text-gray-400">All Countries</p>
              </div>
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3">
                  <Users className="w-5 h-5 text-[hsl(48,96%,53%)]" />
                </div>
                <p className="text-sm text-gray-400">Real Relations Data</p>
              </div>
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3">
                  <BarChart3 className="w-5 h-5 text-[hsl(48,96%,53%)]" />
                </div>
                <p className="text-sm text-gray-400">August 2025 Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p className="tracking-wide">Interactive Geopolitics Mapping</p>
            <div className="flex items-center gap-6">
              <Link href="/diplomacy" className="hover:text-gray-300 transition-colors">Diplomacy</Link>
              <Link href="/conflict" className="hover:text-gray-300 transition-colors">Conflict</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
