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
      className="relative bg-white dark:bg-gray-900 border-y-2 border-secondary/30 shadow-sm mb-4"
      role="banner"
      aria-label="Data update information"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5"></div>
      <div className="relative px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-center space-x-2">
          <div className="flex-shrink-0">
            <svg 
              className="w-4 h-4 text-secondary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-primary dark:text-primary-foreground">
            Data last updated: 
            <span className="ml-1 font-bold text-primary dark:text-secondary">
              August, 2025
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};