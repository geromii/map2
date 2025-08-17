// frame for map
import { useState } from "react";
import {
  IconArrowsDiagonalMinimize2,
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize,
  IconArrowsDiagonal2,
  IconArrowsMaximize,
} from "@tabler/icons-react";

export default function MapFrame({
  LeftSidebar,
  RightSidebar,
  TabDiv,
  MapDiv,
  pageMode,
}) {
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  const sidebarFull = 15;
  const sidebarSmall = 3.5;

  const leftSidebarWidth = leftSidebarVisible ? sidebarFull : sidebarSmall;
  const rightSidebarWidth = rightSidebarVisible ? sidebarFull : sidebarSmall;
  const marginRightSidebar =
    (rightSidebarVisible ? -8 : 0) + (leftSidebarVisible ? 0 : 4);
  const marginLeftSidebar =
    (leftSidebarVisible ? -8 : 0) + (rightSidebarVisible ? 0 : 4);

  const sidebarClasses = ` self-center  rounded-xl shadow-xl border-[1.5px]  ring-primary z-20 min-h-[55%] lg:min-h-[40%] bg-card hidden lg:block w-full`;
  return (
    <div className=" pt-1 w-screen flex flex-col lg:flex-row justify-between  mt-0.5 xl:mt-1 lg:my-1 pb-[20px] lg:pb-[70px] border-b-4  min-h-[60vw]">
      {LeftSidebar && <div
        style={{
          width: `${leftSidebarWidth}vw`,
          minWidth: `${leftSidebarWidth}vw`,
          maxWidth: `${leftSidebarWidth}vw`,
          marginRight: `${marginLeftSidebar}px`,
        }}
        className="self-stretch transition-all duration-300  flex"
      >
        <div className={sidebarClasses + ` rounded-l-none border-l-0`}>
          <div className="w-full flex justify-end p-1 pb-0">
            <button
              onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
              className=""
              aria-label="Shrink left sidebar"
            >
              {leftSidebarVisible ? (
                <IconArrowsDiagonalMinimize2 />
              ) : (
                <IconArrowsDiagonal />
              )}
            </button>
          </div>
          {leftSidebarVisible && <LeftSidebar />}
        </div>
      </div>}

      <div
        className="map relative w-full lg:w-[88%]  row-start-1 transition-all duration-300  h-full"
      >
        <div className=" flex flex-col items-center  bg-transparent md:scale-[1.00] w-full h-full ">
          <TabDiv pageMode={pageMode}/>
          <MapDiv mapMode={pageMode} />
        </div>
        <div className="hidden lg:block absolute bottom-0 left-0.5 z-30">
          {(leftSidebarVisible || rightSidebarVisible) && (
            <button
              onClick={() => {
                setLeftSidebarVisible(false);
                setRightSidebarVisible(false);
              }}
              aria-label="Expand map"
            >
              <IconArrowsMaximize color="white" size={28} />
            </button>
          )}
        </div>
      </div>

      {RightSidebar && (
        <div
          style={{
            width: `${rightSidebarWidth}vw`,
            minWidth: `${rightSidebarWidth}vw`,
            maxWidth: `${rightSidebarWidth}vw`,
            marginLeft: `${marginRightSidebar}px`,
          }}
          className="self-stretch transition-all duration-300 flex "
        >
          <div className={sidebarClasses + ` rounded-r-none  border-r-0`}>
            <div className="w-full flex justify-start p-1 pb-0 ">
              <button
                onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
                className=""
                aria-label="Shrink right sidebar"
              >
                {rightSidebarVisible ? (
                  <IconArrowsDiagonalMinimize />
                ) : (
                  <IconArrowsDiagonal2 />
                )}
              </button>
            </div>
            {rightSidebarVisible && <RightSidebar />}
          </div>
        </div>
      )}
      <div className="mobile view flex h-[300px] lg:hidden divide-x-2">
        <div className="pl-1 w-1/2">
          <LeftSidebar />
        </div>
        <div className="pl-1 w-1/2">
          {RightSidebar && <RightSidebar />}
        </div>
      </div>
    </div>
  );
}
