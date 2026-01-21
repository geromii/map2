"use client";

import React, { useState } from "react";
import TabDemographic from "../tabDemographic";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export default function DemographicsSection({
  phase2Countries,
  phase3Countries,
  pageMode,
  displayStats,
}) {
  const [demographicsExpanded, setDemographicsExpanded] = useState(false);

  return (
    <div className="w-full bg-white dark:bg-gray-900 mt-10 mb-12 max-w-xl mx-auto px-4">
      {/* Demographics Accordion */}
      <div>
        <button
          onClick={() => setDemographicsExpanded(!demographicsExpanded)}
          className="w-full px-6 py-3 bg-primary hover:bg-primary/90 flex items-center justify-center text-base font-medium text-primary-foreground transition-all duration-200 group rounded-lg border-2 border-secondary"
        >
          <span>Demographics</span>
          <div className="ml-2 transition-all duration-300 group-hover:scale-110 group-hover:text-secondary">
            {demographicsExpanded ? (
              <IconChevronUp size={18} className="text-secondary" />
            ) : (
              <IconChevronDown size={18} className="text-secondary" />
            )}
          </div>
        </button>
        {demographicsExpanded && (
          <div className="p-4 border-2 border-t-0 border-secondary rounded-b-lg bg-gray-50 dark:bg-gray-800">
            <TabDemographic
              phase2Countries={phase2Countries}
              phase3Countries={phase3Countries}
              pageMode={pageMode}
              displayStats={displayStats}
            />
          </div>
        )}
      </div>
    </div>
  );
}