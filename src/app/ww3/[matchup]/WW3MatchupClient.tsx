"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import "../../conflict/multiapp.css";
import useCountryStore from "../../useCountryStore";
import { SearchBox } from "@/components/custom/SearchBox";
import { IconTrash } from "@tabler/icons-react";
import ShuffleCountries from "@/components/custom/shuffle";
import TabDiv from "@/components/custom/FrameChildren/TabDiv";
import { MapDiv } from "@/components/custom/FrameChildren/MapDiv";
import IconButton from "@/components/custom/boxbutton";
import MapFrame from "@/components/custom/FrameMapAndSidebar";
import { ConflictMatchup } from "@/utils/conflictSlug";

interface WW3MatchupClientProps {
  matchup: ConflictMatchup | null;
}

export function WW3MatchupClient({ matchup }: WW3MatchupClientProps) {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  const setMapMode = useCountryStore((state) => state.setMapMode);

  useEffect(() => {
    setMapMode("war"); // WW3 uses war mode

    if (matchup) {
      resetAllExcept();
      // Set blue countries (phase 2)
      matchup.blueCountries.forEach((country) => {
        setCountryPhase(country, 2);
      });
      // Set red countries (phase 3) with small delay to ensure proper state update
      setTimeout(() => {
        matchup.redCountries.forEach((country) => {
          setCountryPhase(country, 3);
        });
      }, 10);
    } else {
      resetAllExcept();
    }
  }, [matchup, resetAllExcept, setCountryPhase, setMapMode]);

  if (matchup === null) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Scenario not found</h1>
          <p className="text-slate-600 mb-4">This WW3 scenario doesn&apos;t exist or contains invalid countries.</p>
          <Link
            href="/ww3"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            ← Back to WW3 Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MapFrame
      LeftSidebar={LeftSidebar}
      RightSidebar={RightSidebar}
      TabDiv={TabDiv}
      MapDiv={MapDiv}
      pageMode="multi"
    />
  );
}

const RightSidebar = () => {
  return (
    <div className="h-full w-full flex items-start justify-center px-1 pt-4 sm:pt-2 xl:pt-4 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <h2 className="font-semibold mb-2 pl-3 flex-shrink-0">Country Search</h2>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SearchBox />
        </div>
      </div>
    </div>
  );
};

const LeftSidebar = () => {
  return (
    <div className="flex flex-col justify-evenly mb-3">
      <div className="h-1/3 p-2 border-muted">
        <div className="flex justify-evenly mb-4 mt-4">
          <ShuffleCountries />
          <ResetCountries />
        </div>
      </div>

      <div className="h-1/3 p-1 border-muted w-full">
        <h2 className="font-semibold">Presets</h2>
        <div className="mt-2 overflow-hidden">
          <PresetPairings />
        </div>
      </div>
    </div>
  );
};

const topPresets = [
  { value: "United States - Russia", label: "USA vs Russia" },
  { value: "United States - China", label: "USA vs China" },
  { value: "Israel - Iran", label: "Israel vs Iran" },
  { value: "Israel - Palestine", label: "Israel vs Palestine" },
  { value: "China - Taiwan", label: "China vs Taiwan" },
  { value: "China - India", label: "China vs India" },
];

const morePresets = [
  { value: "Russia - Ukraine", label: "Russia vs Ukraine" },
  { value: "India - Pakistan", label: "India vs Pakistan" },
  { value: "North Korea - South Korea", label: "North vs South Korea" },
  { value: "Saudi Arabia - Iran", label: "Saudi Arabia vs Iran" },
  { value: "Turkey - Greece", label: "Turkey vs Greece" },
  { value: "Armenia - Azerbaijan", label: "Armenia vs Azerbaijan" },
  { value: "Ethiopia - Egypt", label: "Ethiopia vs Egypt" },
];

const PresetPairings = () => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);

  const handlePresetClick = (value: string) => {
    const [country1, country2] = value.split("-");
    resetAllExcept();
    setCountryPhase(country1.trim(), 2);
    if (country2) {
      setTimeout(() => {
        setCountryPhase(country2.trim(), 3);
      }, 1);
    }
  };

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value) {
      handlePresetClick(event.target.value);
      event.target.value = "";
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {topPresets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className="px-2 py-1 text-xs font-medium rounded border border-primary/20 bg-white hover:bg-yellow-400 hover:border-yellow-400 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <select
        className="rounded shadow bg-primary-foreground text-sm py-1 px-2 w-full"
        aria-label="More WW3 scenario presets"
        onChange={handleDropdownChange}
        defaultValue=""
      >
        <option value="">More Presets...</option>
        {morePresets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const ResetCountries = () => {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  return (
    <IconButton
      icon={IconTrash}
      size="medium"
      aria-label="Clear map - reset all countries"
      onClick={() => {
        resetAllExcept();
      }}
    />
  );
};
