import React from 'react';

export function MapSkeleton () {
  return (
    <>
      {/* Map Container Skeleton */}
      <div className="map-container z-11 lg:relative top-0 right-0 bottom-0 left-0 lg:z-0 lg:border-b-4">
        {/* Custom aspect ratio container for the placeholder */}
        <div className="relative w-full aspect-[100/55] bg-gray-300 animate-pulse flex justify-center items-center">
            {/* This inner div is for further content or additional styling */}
            <div className="w-[15rem] h-[15rem] rounded-full bg-gray-400"></div>
        </div>
     </div>
      {/* Map Controls Skeleton */}
      <div className="map-controls pt-2 pb-2 border-x-4 border-y-2 lg:border-y-4 lg:absolute lg:top-0 lg:left-0 z-10 bg-slate-200 lg:h-28 lg:w-52 lg:rounded-br-3xl lg:pt-0 lg:overflow-hidden lg:pl-6 animate-pulse">
        <div className="space-y-4 py-2">
          {/* Simulate buttons/controls */}
          <div className="h-4 bg-gray-400 rounded w-3/4"></div>
          <div className="h-4 bg-gray-400 rounded w-2/4"></div>
          <div className="h-4 bg-gray-400 rounded w-3/4"></div>
        </div>
      </div>

      {/* Country Search Skeleton */}
      <div className="country-search border-x-4 border-y-2 lg:border-y-4 pl-2 pr-2 pt-2 pb-2 lg:absolute lg:top-0 lg:right-0 z-10 bg-slate-200 overflow-x-hidden overflow-y-hidden lg:rounded-bl-3xl lg:pl-1 lg:h-28 lg:w-52 animate-pulse">
        <div className="space-y-2 py-2">
          {/* Simulate search bar */}
          <div className="h-5 bg-gray-400 rounded w-5/6"></div>
          {/* Simulate list items */}
          <div className="h-3 ml-8 bg-gray-400 rounded w-3/6"></div>
          <div className="h-3 ml-8 bg-gray-400 rounded w-2/6"></div>
          <div className="h-3 ml-8 bg-gray-400 rounded w-3/6"></div>
        </div>
      </div>
    </>
  );
};

