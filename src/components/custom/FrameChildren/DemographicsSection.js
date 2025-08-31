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
    <div className="w-full bg-white dark:bg-gray-900 mt-4 max-w-3xl mx-auto">
      {/* Demographics Accordion */}
      <div>
        <button
          onClick={() => setDemographicsExpanded(!demographicsExpanded)}
          className="w-full pl-5 pr-2 py-2 bg-primary hover:bg-primary/90 flex items-center justify-center text-base font-medium text-primary-foreground transition-all duration-200 group border-b-2 rounded-lg border-2 border-secondary "
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
          <div className="p-4">
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