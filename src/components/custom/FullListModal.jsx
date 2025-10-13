import React, { useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { getCountryEmoji } from "../../utils/countryEmojis";
import { abbreviateCountry } from "../../utils/abbreviateCountry";
import useCountryStore from "../../app/useCountryStore";

function FullListModal({ isOpen, onClose, fullSortedList, pageMode, phase2Countries, phase3Countries }) {
  const { setCountryPhase, resetAllExcept } = useCountryStore((state) => ({
    setCountryPhase: state.setCountryPhase,
    resetAllExcept: state.resetAllExcept,
  }));

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCountryClick = (country) => {
    if (pageMode === "single") {
      resetAllExcept();
      setCountryPhase(country, "blue");
      onClose();
    }
  };

  const isClickable = pageMode === "single";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Full Opinion List
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <IconX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Selected Countries */}
        {(phase2Countries.length > 0 || phase3Countries.length > 0) && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              {phase2Countries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-700 dark:border-blue-600 rounded-lg">
                  {phase2Countries.map((country) => (
                    <div key={`blue-${country}`} className="flex items-center gap-1">
                      <span className="text-base">{getCountryEmoji(country)}</span>
                      <span className="text-sm font-medium text-black dark:text-white">
                        {abbreviateCountry(country)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {phase3Countries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border-2 border-red-700 dark:border-red-600 rounded-lg">
                  {phase3Countries.map((country) => (
                    <div key={`red-${country}`} className="flex items-center gap-1">
                      <span className="text-base">{getCountryEmoji(country)}</span>
                      <span className="text-sm font-medium text-black dark:text-white">
                        {abbreviateCountry(country)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-2 py-2 flex-1 will-change-scroll" style={{ transform: 'translateZ(0)' }}>
          <div className="space-y-0.5">
            {fullSortedList.map((item, index) => {
              const isPositive = item.preferenceScore > 0;
              return (
                <div
                  key={item.country}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    isClickable
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      : ""
                  } ${
                    isPositive
                      ? "bg-blue-50/60 dark:bg-blue-950/10"
                      : "bg-red-50/60 dark:bg-red-950/10"
                  }`}
                  onClick={isClickable ? () => handleCountryClick(item.country) : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-8 text-right flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-xl flex-shrink-0">
                      {getCountryEmoji(item.country)}
                    </span>
                    <span className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 truncate">
                      {abbreviateCountry(item.country)}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-sm md:text-base tabular-nums font-medium flex-shrink-0 ml-2 ${
                      isPositive
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {item.preferenceScore.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullListModal;
