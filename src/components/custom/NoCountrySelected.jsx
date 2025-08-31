import React from "react";
import {
  IconInfoCircle,
  IconArrowBigDownLines,
} from "@tabler/icons-react";

const NoCountrySelected = ({
  pageMode = "single",
  phase2Exists = false,
  phase3Exists = false,
}) => {
  return pageMode === "single" ? (
    <div className="flex justify-around align-top w-full -translate-y-2 items-center drop-shadow">
      <div className="flex p-1 lg:p-2 border-2 border-yellow-400 bg-yellow-300 rounded-full shadow-lg font-medium items-center ">
        <IconInfoCircle size={22} className="text-primary drop-shadow" />
        {"  "}
        Select a country below...
      </div>
    </div>
  ) : (
    <div className="flex justify-center  w-full ">
      <div
        data-phase2exists={phase2Exists}
        className="flex p-1 lg:p-2 border-[3px] border-blue-500 bg-blue-100 rounded-full shadow-lg font-medium items-center data-[phase2exists=true]:opacity-0 data-[phase2exists=true]:translate-y-8 data-[phase2exists=true]:pointer-events-none transition-all delay-100 duration-500 mr-2 text-center whitespace-nowrap text-xs md:text-sm "
      >
        <IconArrowBigDownLines className="text-primary drop-shadow" size={16} /> Select a blue country...
      </div>
      <div
        data-phase3exists={phase3Exists}
        className="flex p-1 lg:p-2 border-[3px] border-red-500 bg-red-100 rounded-full shadow-lg font-medium items-center data-[phase3exists=true]:opacity-0 data-[phase3exists=true]:translate-y-8 data-[phase3exists=true]:pointer-events-none transition-all delay-100 duration-500 text-center whitespace-nowrap text-xs md:text-sm"
      >
        <IconArrowBigDownLines className="text-primary drop-shadow" size={16} /> Select a red country...
      </div>
    </div>
  );
};

export default NoCountrySelected;