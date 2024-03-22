import React, { useState } from 'react';

const tabs = ['News', 'Select', 'Overlays', 'Data', 'AI Prompt'];

export default function Tabs() {
  const [selectedTab, setSelectedTab] = useState('News');

  const getTabClassName = (tabName) => {
    const isSelected = selectedTab === tabName;
    const baseClasses = 'cursor-pointer text-center font-medium flex items-center justify-center mt-0.5 xl:mt-1 hover:border-primary transition-all delay-70 border-b-0 w-16 md:w-24 xl:w-32 rounded-t-xl lg:rounded-t-3xl lg:border-[2px] xl:border-[3px] xl:border-b-0 lg:border-b-0';
    const colorClasses = isSelected
      ? 'bg-primary text-secondary border-accent-foreground text-primary transition-all'
      : 'bg-secondary-foreground text-secondary border-accent-foreground';
    return `${baseClasses} ${colorClasses}`;
  };

  return (
    <div className="flex flex-col justify-end h-full"> {/* Adjust this line */}
      <div className="flex justify-between w-full px-4 text-xs md:text-sm lg:text-base md:px-4 lg:px-16 bg-white max-h-10 ">
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
    <div className="row-span-3 bg-primary h-full text-white">
      Content for {selectedTab}
    </div>
  );
}