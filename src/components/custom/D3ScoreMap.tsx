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
          height: width * 0.5, // 2:1 aspect ratio
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

  // Create projection
  const projection = d3
    .geoNaturalEarth1()
    .fitSize([dimensions.width, dimensions.height], countries);

  const pathGenerator = d3.geoPath().projection(projection);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      className={`w-full ${className}`}
      style={{ backgroundColor: "#f8fafc" }}
    >
      {/* Ocean background */}
      <rect width={dimensions.width} height={dimensions.height} fill="#f1f5f9" />

      {/* Country paths */}
      <g>
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
              stroke="#94a3b8"
              strokeWidth={0.5}
              className="transition-colors duration-150 cursor-pointer hover:brightness-90"
              onMouseEnter={() => onCountryHover?.(name, countryScore || null)}
              onMouseLeave={() => onCountryHover?.(null, null)}
              onClick={() => onCountryClick?.(name, countryScore || null)}
            />
          );
        })}
      </g>
    </svg>
  );
}

// Color legend component
export function ScoreLegend({
  sideALabel = "Supports",
  sideBLabel = "Opposes",
  showPending = false,
}: {
  sideALabel?: string;
  sideBLabel?: string;
  showPending?: boolean;
}) {
  const gradientStops = [
    { offset: "0%", color: scoreToColor(-1) },
    { offset: "25%", color: scoreToColor(-0.5) },
    { offset: "50%", color: scoreToColor(0) },
    { offset: "75%", color: scoreToColor(0.5) },
    { offset: "100%", color: scoreToColor(1) },
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
      <span className="text-red-700 font-medium">{sideBLabel}</span>
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
      <span className="text-blue-700 font-medium">{sideALabel}</span>
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
    score > 0.3
      ? sideALabel
      : score < -0.3
      ? sideBLabel
      : "Neutral";

  const stanceColor =
    score > 0.3 ? "text-blue-700" : score < -0.3 ? "text-red-700" : "text-slate-600";

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
