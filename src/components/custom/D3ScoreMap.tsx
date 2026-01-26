"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3-geo";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

interface CountryScore {
  score: number;
  reasoning?: string;
}

interface D3ScoreMapProps {
  scores: Record<string, CountryScore>;
  onCountryHover?: (country: string | null, score: CountryScore | null) => void;
  onCountryClick?: (country: string, score: CountryScore | null) => void;
  className?: string;
}

interface CountryGeometry {
  type: string;
  id: string;
  properties: { name: string };
  arcs: number[][];
}

type WorldTopology = Topology<{ world: GeometryCollection<{ name: string }> }>;

function scoreToColor(score: number): string {
  // Clamp score to [-1, 1]
  const clamped = Math.max(-1, Math.min(1, score));

  // Apply power transformation to compress scores toward neutral
  // e.g., -0.3 becomes ~-0.137, making moderate scores appear more neutral
  const s = Math.sign(clamped) * Math.abs(clamped) ** 1.3;

  // Calculate intensity for saturation/lightness adjustments
  const intensity = Math.abs(s);

  // Blue for positive (Side A), Red for negative (Side B)
  if (s >= 0) {
    // Blue tones - saturation scales from 0 to 90
    const saturation = 90 * intensity;
    const lightness = 92 - 47 * intensity;
    return `hsl(217, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  } else {
    // Red tones - saturation scales from 0 to 90
    const saturation = 90 * intensity;
    const lightness = 92 - 45 * intensity;
    return `hsl(4, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  }
}

export function D3ScoreMap({
  scores,
  onCountryHover,
  onCountryClick,
  className = "",
}: D3ScoreMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [topology, setTopology] = useState<WorldTopology | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

  // Load topojson data
  useEffect(() => {
    fetch("/features.json")
      .then((res) => res.json())
      .then((data: WorldTopology) => setTopology(data))
      .catch(console.error);
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        const { width } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({
          width,
          height: width * 0.58, // ~1.7:1 aspect ratio - more vertical ocean space
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get color for a country
  const getCountryColor = useCallback(
    (name: string) => {
      const countryScore = scores[name];
      if (countryScore === undefined) return "#d1d5db"; // Gray for countries awaiting data
      return scoreToColor(countryScore.score);
    },
    [scores]
  );

  if (!topology) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`} style={{ height: dimensions.height }}>
        <div className="text-slate-500">Loading map...</div>
      </div>
    );
  }

  // Convert topojson to geojson
  const countries = topojson.feature(
    topology,
    topology.objects.world
  ) as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;

  // Create projection - centered on Europe/Africa, zoomed in to exclude Pacific
  const projection = d3
    .geoNaturalEarth1()
    .center([10, 10]) // Shift center east (longitude 20) and slightly north
    .rotate([-7, 0, 0]) // Rotate 5 degrees
    .scale(dimensions.width / 4.85) // Zoom level (smaller divisor = more zoom)
    .translate([dimensions.width / 2, dimensions.height / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

  return (
    <div className="relative w-full h-full">
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          boxShadow: 'inset 0 0 60px 20px rgba(0, 0, 0, 0.15), inset 0 0 100px 40px rgba(0, 0, 0, 0.08)',
        }}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className={`w-full h-full ${className}`}
        style={{ backgroundColor: "#64748b" }}
      >
        {/* Background pattern and clip path */}
        <defs>
          <clipPath id="map-clip">
            <rect x="0" y="0" width={dimensions.width} height={dimensions.height} />
          </clipPath>
          <pattern
            id="bg-pattern"
            x="0"
            y="0"
            width="40"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <image
              href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 28' width='56' height='28'%3E%3Cpath fill='%23ffffff' fill-opacity='0.035' d='M56 26v2h-7.75c2.3-1.27 4.94-2 7.75-2zm-26 2a2 2 0 1 0-4 0h-4.09A25.98 25.98 0 0 0 0 16v-2c.67 0 1.34.02 2 .07V14a2 2 0 0 0-2-2v-2a4 4 0 0 1 3.98 3.6 28.09 28.09 0 0 1 2.8-3.86A8 8 0 0 0 0 6V4a9.99 9.99 0 0 1 8.17 4.23c.94-.95 1.96-1.83 3.03-2.63A13.98 13.98 0 0 0 0 0h7.75c2 1.1 3.73 2.63 5.1 4.45 1.12-.72 2.3-1.37 3.53-1.93A20.1 20.1 0 0 0 14.28 0h2.7c.45.56.88 1.14 1.29 1.74 1.3-.48 2.63-.87 4-1.15-.11-.2-.23-.4-.36-.59H26v.07a28.4 28.4 0 0 1 4 0V0h4.09l-.37.59c1.38.28 2.72.67 4.01 1.15.4-.6.84-1.18 1.3-1.74h2.69a20.1 20.1 0 0 0-2.1 2.52c1.23.56 2.41 1.2 3.54 1.93A16.08 16.08 0 0 1 48.25 0H56c-4.58 0-8.65 2.2-11.2 5.6 1.07.8 2.09 1.68 3.03 2.63A9.99 9.99 0 0 1 56 4v2a8 8 0 0 0-6.77 3.74c1.03 1.2 1.97 2.5 2.79 3.86A4 4 0 0 1 56 10v2a2 2 0 0 0-2 2.07 28.4 28.4 0 0 1 2-.07v2c-9.2 0-17.3 4.78-21.91 12H30zM7.75 28H0v-2c2.81 0 5.46.73 7.75 2zM56 20v2c-5.6 0-10.65 2.3-14.28 6h-2.7c4.04-4.89 10.15-8 16.98-8zm-39.03 8h-2.69C10.65 24.3 5.6 22 0 22v-2c6.83 0 12.94 3.11 16.97 8zm15.01-.4a28.09 28.09 0 0 1 2.8-3.86 8 8 0 0 0-13.55 0c1.03 1.2 1.97 2.5 2.79 3.86a4 4 0 0 1 7.96 0zm14.29-11.86c1.3-.48 2.63-.87 4-1.15a25.99 25.99 0 0 0-44.55 0c1.38.28 2.72.67 4.01 1.15a21.98 21.98 0 0 1 36.54 0zm-5.43 2.71c1.13-.72 2.3-1.37 3.54-1.93a19.98 19.98 0 0 0-32.76 0c1.23.56 2.41 1.2 3.54 1.93a15.98 15.98 0 0 1 25.68 0zm-4.67 3.78c.94-.95 1.96-1.83 3.03-2.63a13.98 13.98 0 0 0-22.4 0c1.07.8 2.09 1.68 3.03 2.63a9.99 9.99 0 0 1 16.34 0z'%3E%3C/path%3E%3C/svg%3E"
              width="40px"
              height="20px"
            />
          </pattern>
        </defs>
        <rect x="-500" y="-500" width="2000" height="1500" fill="url(#bg-pattern)" />

      {/* Country paths */}
      <g clipPath="url(#map-clip)">
        {countries.features.map((feature) => {
          const name = feature.properties.name;
          const countryScore = scores[name];
          const path = pathGenerator(feature);

          if (!path) return null;

          return (
            <path
              key={feature.id || name}
              d={path}
              fill={getCountryColor(name)}
              stroke="#334155"
              strokeWidth={0.4}
              className="transition-colors duration-150 cursor-pointer hover:brightness-90"
              onMouseEnter={() => onCountryHover?.(name, countryScore || null)}
              onMouseLeave={() => onCountryHover?.(null, null)}
              onClick={() => onCountryClick?.(name, countryScore || null)}
            />
          );
        })}
      </g>
      </svg>
    </div>
  );
}

// Color legend component
export function ScoreLegend({
  sideALabel = "Supports",
  sideBLabel = "Opposes",
  sideACount,
  sideBCount,
  showPending = false,
}: {
  sideALabel?: string;
  sideBLabel?: string;
  sideACount?: number;
  sideBCount?: number;
  showPending?: boolean;
}) {
  // Gradient goes from blue (sideA, left) to red (sideB, right)
  const gradientStops = [
    { offset: "0%", color: scoreToColor(1) },
    { offset: "25%", color: scoreToColor(0.5) },
    { offset: "50%", color: scoreToColor(0) },
    { offset: "75%", color: scoreToColor(-0.5) },
    { offset: "100%", color: scoreToColor(-1) },
  ];

  return (
    <div className="flex items-center gap-3 text-sm">
      {showPending && (
        <>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#d1d5db]" />
            <span className="text-slate-500">Pending</span>
          </div>
          <span className="text-slate-300">|</span>
        </>
      )}
      <span className="text-blue-700 font-medium">
        {sideACount !== undefined && <span className="mr-1">{sideACount}</span>}
        {sideALabel}
      </span>
      <div className="relative w-32 h-3 rounded-full overflow-hidden">
        <svg width="100%" height="100%">
          <defs>
            <linearGradient id="score-gradient">
              {gradientStops.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#score-gradient)" />
        </svg>
      </div>
      <span className="text-red-700 font-medium">
        {sideBCount !== undefined && <span className="mr-1">{sideBCount}</span>}
        {sideBLabel}
      </span>
    </div>
  );
}

// Tooltip component
export function CountryTooltip({
  country,
  score,
  reasoning,
  sideALabel = "Supports",
  sideBLabel = "Opposes",
}: {
  country: string;
  score: number;
  reasoning?: string;
  sideALabel?: string;
  sideBLabel?: string;
}) {
  const stance =
    score > 0.305
      ? sideALabel
      : score < -0.305
      ? sideBLabel
      : "Neutral";

  const stanceColor =
    score > 0.305 ? "text-blue-700" : score < -0.305 ? "text-red-700" : "text-slate-600";

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 max-w-xs">
      <div className="font-semibold text-slate-900">{country}</div>
      <div className={`text-sm font-medium ${stanceColor}`}>
        {stance} ({score > 0 ? "+" : ""}{score.toFixed(2)})
      </div>
      {reasoning && (
        <div className="text-xs text-slate-600 mt-1 line-clamp-3">{reasoning}</div>
      )}
    </div>
  );
}
