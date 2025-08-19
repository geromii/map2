import React from 'react';

export const DataUpdateBanner = () => {
  const updateDate = new Date('2025-08-18');
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 4);

  // Only show banner if update date is within the last 6 months
  if (updateDate < sixMonthsAgo) {
    return null;
  }

  return (
    <div 
      className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-b border-blue-200 dark:border-slate-600 shadow-sm"
      role="banner"
      aria-label="Data update information"
    >
      <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/10"></div>
      <div className="relative px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-center space-x-2">
          <div className="flex-shrink-0">
            <svg 
              className="w-4 h-4 text-blue-600 dark:text-blue-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            Data last updated: 
            <span className="ml-1 font-bold text-blue-900 dark:text-blue-100">
              August 18, 2025
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};