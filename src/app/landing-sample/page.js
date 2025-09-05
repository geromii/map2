import React from "react";
import Link from "next/link";
import { Globe, Swords } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingSample() {
  return (
    <div className="min-h-screen bg-[hsl(222.2,47.4%,11.2%)] flex flex-col items-center justify-center p-6">
      <div className="max-w-6xl w-full space-y-16">
        <div className="text-center space-y-6">
          <Badge variant="secondary" className="mb-4 text-[hsl(48,96%,53%)] border-[hsl(48,96%,53%)]">
            Interactive Mapping Platform
          </Badge>
          <h1 className="text-7xl lg:text-8xl text-white tracking-tight font-arvo font-medium">
            Mapdis
          </h1>
          <p className="text-2xl text-gray-300 font-light max-w-3xl mx-auto">
            Interactive Global Relations & Conflict Visualization
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-4 border-[hsl(48,96%,53%)] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-6 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                <Globe className="w-16 h-16 text-[hsl(222.2,47.4%,11.2%)]" />
              </div>
              <CardTitle className="text-3xl font-bold text-[hsl(222.2,47.4%,11.2%)]">
                Country Relations
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Explore diplomatic relationships, alliances, and international dynamics between countries worldwide
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-2">
              <Link href="/country">
                <Button 
                  size="lg" 
                  className="bg-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(222.2,47.4%,15%)] text-white font-semibold group"
                >
                  Explore Countries
                  <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-4 border-[hsl(48,96%,53%)] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-6 bg-yellow-50 rounded-full group-hover:bg-yellow-100 transition-colors">
                <Swords className="w-16 h-16 text-[hsl(48,96%,53%)]" />
              </div>
              <CardTitle className="text-3xl font-bold text-[hsl(222.2,47.4%,11.2%)]">
                Conflict Analysis
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Analyze global conflicts, understand opposing sides, and track international positions on key disputes
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-2">
              <Link href="/conflict">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-[hsl(48,96%,53%)] text-[hsl(48,96%,53%)] hover:bg-[hsl(48,96%,53%)] hover:text-white font-semibold group"
                >
                  View Conflicts
                  <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[hsl(48,96%,53%)] rounded-full"></div>
              <span className="text-sm">Real-time Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[hsl(48,96%,53%)] rounded-full"></div>
              <span className="text-sm">Interactive Maps</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[hsl(48,96%,53%)] rounded-full"></div>
              <span className="text-sm">Global Coverage</span>
            </div>
          </div>
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Interactive geopolitics and diplomacy mapping
          </p>
        </div>
      </div>
    </div>
  );
}