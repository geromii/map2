"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import useCountryStore from "@/app/useCountryStore";
import TabDiv from "@/components/custom/FrameChildren/TabDiv";
import { MapDiv } from "@/components/custom/FrameChildren/MapDiv";
import MapFrame from "@/components/custom/FrameMapAndSidebar";
import ShuffleCountries from "@/components/custom/shuffle";
import { SearchCountry } from "@/components/custom/SearchCountry";
import useEuCountries from "@/utils/eu";

interface DiplomacyClientProps {
  countryName: string | null;
}

export function DiplomacyClient({ countryName }: DiplomacyClientProps) {
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  const setMapMode = useCountryStore((state) => state.setMapMode);

  useEffect(() => {
    setMapMode("single");

    if (countryName) {
      resetAllExcept();
      setCountryPhase(countryName, 2);
    } else {
      resetAllExcept();
    }
  }, [countryName, resetAllExcept, setCountryPhase, setMapMode]);

  if (countryName === null) {
    return (
      <div className="h-[calc(100vh-48px)] bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Country not found</h1>
          <p className="text-slate-600 mb-4">This country doesn&apos;t exist in our database.</p>
          <Link
            href="/diplomacy"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            ← Back to Diplomacy Map
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
      pageMode="single"
    />
  );
}

const RightSidebar = () => {
  return (
    <div className="h-full w-full flex items-start justify-center px-0 pt-2 xl:px-0.5 sm:pt-2 xl:pt-2 overflow-hidden">
      <div className="h-full p-1 lg:p-[1.5px] xl:p-2 border-muted w-full text-sm lg:text-base overflow-hidden">
        <div className="overflow-hidden">
          <PresetPairings />
        </div>
      </div>
    </div>
  );
};

const LeftSidebar = () => {
  return (
    <div className="flex flex-col justify-evenly text-sm lg:text-base">
      <div className="flex justify-evenly mt-5 lg:text-lg">
        <ShuffleCountries singleMode={true} />
      </div>
      <div className="w-full pt-5">
        <h2 className="font-semibold mb-2 pl-3 text-sm text-center lg:text-base">Country Search</h2>
        <SearchCountry pageMode="single" />
      </div>
    </div>
  );
};

const PresetPairings = () => {
  const euCountries = useEuCountries();
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);

  const handleSingleCountrySelection = (country: string) => {
    resetAllExcept(country);
    setCountryPhase(country, 2);
  };

  const handleEuropeanUnionClick = () => {
    resetAllExcept();
    euCountries.forEach((country) => {
      setCountryPhase(country, 2);
    });
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center overflow-y-auto">
      <h2 className="font-semibold mb-4 pl-3 text-sm lg:text-base">Quick Access</h2>
      <div className="grid grid-cols-2 mb-2 gap-4 w-full mx-4 px-1">
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Palestine')}>Palestine</button>
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Israel')}>Israel</button>
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Kosovo')}>Kosovo</button>
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Cyprus')}>Cyprus</button>
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Taiwan')}>Taiwan</button>
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400" onClick={() => handleSingleCountrySelection('Armenia')}>Armenia</button>
        <button className="rounded-md shadow bg-primary text-white p-1 ring-2 ring-yellow-400 col-span-2" onClick={() => handleEuropeanUnionClick()}>European Union</button>
      </div>
    </div>
  );
};
