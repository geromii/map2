import React, { useState } from "react";
import useCountryStore from "./useCountryStore";

const tabs = ["News", "Select", "Overlays", "Data"];

export default function Tabs() {
  const [selectedTab, setSelectedTab] = useState("News");

  const getTabClassName = (tabName) => {
    const isSelected = selectedTab === tabName;
    const baseClasses =
      "cursor-pointer text-center font-medium flex items-center justify-center hover:border-primary transition-colors transition-transform sm:transition-all border-b-0 w-16 md:w-24 xl:w-32 rounded-t xl:rounded-t-lg hover:border-x-2 hover:border-t-2 hover:lg:border-x-4 hover:lg:border-t-4 xl:border-b-0 lg:border-b-0 box-border sm:delay-0";
    const colorClasses = isSelected
      ? "bg-black text-white border-primary border-2 lg:border-4 translate-y-0.5 lg:translate-y-1 z-20"
      : "bg-secondary-foreground text-secondary border-white hover:translate-y-0.5 lg:translate-y-0.5 hover:lg:translate-y-1 z-0 hover:z-20";
    return `${baseClasses} ${colorClasses}`;
  };

  return (
    <div className="flex flex-col justify-end h-full overflow-hidden">
      {" "}
      {/* Adjust this line */}
      <div className="flex justify-evenly w-full text-xs md:text-sm lg:text-base 2xl:text-lg max-h-10 ">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={getTabClassName(tab)}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
      <TabContent selectedTab={selectedTab} />
    </div>
  );
}

function TabContent({ selectedTab }) {
  return (
    <div className="rounded-t-lg row-span-3 bg-accent-foreground text-primary border-primary border-2 border-b-1 lg:border-4 lg:border-b-[1px] h-full p-5 scale-x-[1.01] sm:scale-x-100 z-10 overflow-hidden">
      {selectedTab === "News" && <NewsContent />}
      {selectedTab === "Select" && <SelectContent />}
      {selectedTab === "Overlays" && <OverlaysContent />}
      {selectedTab === "Data" && <DataContent />}
    </div>
  );
}

function NewsContent() {
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  return <div>
    <h1>Preset</h1>
    <ul>
    </ul>
  </div>;
}

function SelectContent() {
  return <div>Content for Select</div>;
}

function OverlaysContent() {
  return <div>Content for Overlays</div>;
}

function DataContent() {
  return <div>Content for Data</div>;
}
