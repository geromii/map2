"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X } from "lucide-react";

interface CountryDetailModalProps {
  country: string;
  score: number;
  reasoning?: string;
  sideALabel: string;
  sideBLabel: string;
  onClose: () => void;
  headlineId?: Id<"headlines">;
  issueId?: Id<"issues">;
}

function scoreToColor(score: number): string {
  const clamped = Math.max(-1, Math.min(1, score));
  const s = Math.sign(clamped) * Math.abs(clamped) ** 1.3;
  const intensity = Math.abs(s);

  if (s >= 0) {
    const saturation = 90 * intensity ** 0.7;
    const lightness = 92 - 47 * intensity;
    return `hsl(217, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  } else {
    const saturation = 90 * intensity;
    const lightness = 92 - 45 * intensity;
    return `hsl(4, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  }
}

export function CountryDetailModal({
  country,
  score,
  reasoning,
  sideALabel,
  sideBLabel,
  onClose,
  headlineId,
  issueId,
}: CountryDetailModalProps) {
  // Fetch full reasoning on-demand when headlineId or issueId is provided
  const headlineReasoning = useQuery(
    api.headlines.getCountryFullReasoning,
    headlineId ? { headlineId, countryName: country } : "skip"
  );
  const issueReasoning = useQuery(
    api.issues.getCountryFullReasoning,
    issueId ? { issueId, countryName: country } : "skip"
  );

  const fullReasoning = headlineId ? headlineReasoning : issueReasoning;

  // Use full reasoning if available, otherwise fall back to preview
  const displayReasoning = fullReasoning ?? reasoning;
  const isLoadingReasoning = (headlineId || issueId) && fullReasoning === undefined;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const stance =
    score > 0.3 ? sideALabel : score < -0.3 ? sideBLabel : "Neutral";

  const stanceColor =
    score > 0.3
      ? "text-blue-700 bg-blue-50"
      : score < -0.3
      ? "text-red-700 bg-red-50"
      : "text-slate-600 bg-slate-100";

  // Score bar position: -1 = 0%, 0 = 50%, 1 = 100%
  const scorePosition = ((score + 1) / 2) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <div className="p-5">
          {/* Country name */}
          <h2 className="text-xl font-bold text-slate-900 pr-8">{country}</h2>

          {/* Stance badge */}
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${stanceColor}`}
            >
              {stance}
            </span>
          </div>

          {/* Score visualization */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{sideBLabel}</span>
              <span>{sideALabel}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden">
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, hsl(4, 90%, 47%), hsl(4, 45%, 70%), hsl(0, 0%, 92%), hsl(217, 45%, 70%), hsl(217, 90%, 45%))",
                }}
              />
              {/* Score indicator */}
              <div
                className="absolute top-0 w-1 h-full bg-slate-900 rounded-full"
                style={{ left: `calc(${scorePosition}% - 2px)` }}
              />
            </div>
            <div className="text-center text-sm text-slate-600 mt-1">
              Score: {score > 0 ? "+" : ""}
              {score.toFixed(2)}
            </div>
          </div>

          {/* Reasoning */}
          {(displayReasoning || isLoadingReasoning || reasoning) && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Reasoning
                </h3>
                {isLoadingReasoning && (
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="min-h-[300px]">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {displayReasoning || reasoning}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
