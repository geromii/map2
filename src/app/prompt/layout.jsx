"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PromptMenu from "@/components/prompt/promptMenu";

// Explore the world's diplomatic relationships and alliances through an interactive map. Dive into the net relationship scores of every country and visualize theoretical conflict scenarios that reveal potential global alliances. A captivating platform for the well-read, curious minds interested in global politics and international relations.

export default function layout({ children }) {
  return (
        <div className="flex w-full h-full">
          <PromptMenu/>
          {children}
        </div>
  );
}
