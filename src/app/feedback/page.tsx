"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

import { Star } from "lucide-react";

const FORM_VERSION = "v1";

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="bg-white rounded-xl border shadow p-6">
      <p className="font-medium text-slate-900 mb-4">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-colors"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= value ? "fill-yellow-400" : ""
              } ${
                hover && star <= hover ? "text-yellow-400" : "text-black"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const submitFeedback = useMutation(api.feedback.submitFeedback);
  const [mapsRating, setMapsRating] = useState(0);
  const [headlinesRating, setHeadlinesRating] = useState(0);
  const [scenariosRating, setScenariosRating] = useState(0);
  const [suggestions, setSuggestions] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFeedback({
        formVersion: FORM_VERSION,
        responses: {
          mapsRating: mapsRating || null,
          headlinesRating: headlinesRating || null,
          scenariosRating: scenariosRating || null,
          suggestions: suggestions.trim() || null,
        },
        userAgent: navigator.userAgent,
        page: document.referrer || undefined,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-48px)] bg-slate-50 py-8">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="bg-white rounded-xl border shadow p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Thank you for your feedback!
            </h2>
            <p className="text-slate-600 mb-4">
              Your response has been recorded and will help us improve.
            </p>
            <a href="/">
              <Button className="bg-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(222.2,47.4%,20%)] text-white">
                Go to home
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-48px)] bg-slate-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Mapdis Geopolitical Map Feedback
          </h1>
          <p className="text-slate-600 mt-1">
            Help us improve by sharing your experience. Takes about 15 seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <StarRating
            label="How do you rate the interactive maps?"
            value={mapsRating}
            onChange={setMapsRating}
          />

          <StarRating
            label="How do you rate the headlines?"
            value={headlinesRating}
            onChange={setHeadlinesRating}
          />

          <StarRating
            label="How do you rate the custom scenarios?"
            value={scenariosRating}
            onChange={setScenariosRating}
          />

          <div className="bg-white rounded-xl border shadow p-6">
            <label className="font-medium text-slate-900 mb-2 block">
              Did anything go wrong? Any suggestions?
            </label>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Your feedback..."
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || (!mapsRating && !headlinesRating && !scenariosRating && !suggestions.trim())}
            className="w-full bg-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(222.2,47.4%,20%)] text-white"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </div>
    </div>
  );
}
