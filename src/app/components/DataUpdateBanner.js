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
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 mb-1">
      <p className="text-sm font-medium text-center">
        Data last updated: August 18, 2025
      </p>
    </div>
  );
};