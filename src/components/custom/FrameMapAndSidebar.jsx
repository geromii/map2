// frame for map
import { useState } from "react";
import {
  IconArrowsDiagonalMinimize2,
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize,
  IconArrowsDiagonal2,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconX,
} from "@tabler/icons-react";

export default function MapFrame({ LeftSidebar, RightSidebar, MainMap }) {
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  const sidebarFull = 15;
  const sidebarSmall = 5;

  const leftSidebarWidth = leftSidebarVisible ? sidebarFull : sidebarSmall;
  const rightSidebarWidth = rightSidebarVisible ? sidebarFull : sidebarSmall;
  const mapWidth = 100 - leftSidebarWidth - rightSidebarWidth;
  const marginRightSidebar = rightSidebarVisible ? -15 : 0;
  const marginLeftSidebar = leftSidebarVisible ? -15 : 0;

  const sidebarClasses = ` self-center  rounded-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border-[1.5px] ring-4 ring-primary z-20 min-h-[80%] lg:min-h-[55%] bg-card hidden lg:block w-full`;
  return (
    <div className=" pt-1 w-screen flex flex-col lg:flex-row justify-between  mt-0.5 xl:mt-1 lg:my-1 pb-[20px] lg:pb-[100px] border-b-4 shadow min-h-[67vw]">
      <div
        style={{
          width: `${leftSidebarWidth}vw`,
          minWidth: `${leftSidebarWidth}vw`,
          maxWidth: `${leftSidebarWidth}vw`,
          marginRight: `${marginLeftSidebar}px`,
        }}
        className="self-stretch transition-all duration-300 ease-in-out flex"
      >
        <div className={sidebarClasses + ` rounded-l-none border-l-0`}>
          <div className="w-full flex justify-end p-1 pb-0">
            <button
              onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
              className=""
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
      </div>

      <div
        className="map relative w-full lg:w-[88%] row-start-1 transition-all duration-300 ease-in-out h-full"
      >
        <MainMap />
        <div className="hidden lg:block absolute bottom-0 left-0.5 z-30">
          {(leftSidebarVisible || rightSidebarVisible) && (
            <button
              onClick={() => {
                setLeftSidebarVisible(false);
                setRightSidebarVisible(false);
              }}
            >
              <IconArrowsMaximize color="white" size={28} />
            </button>
          )}
        </div>
      </div>


      <div
        style={{
          width: `${rightSidebarWidth}vw`,
          minWidth: `${rightSidebarWidth}vw`,
          maxWidth: `${rightSidebarWidth}vw`,
          marginLeft: `${marginRightSidebar}px`,
        }}
        className="self-stretch transition-all duration-300 ease-in-out flex "
      >
        <div className={sidebarClasses + ` rounded-r-none  border-r-0`}>
          <div className="w-full flex justify-start p-1 pb-0 ">
            <button
              onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
              className=""
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
      <div className = "mobile view flex h-[300px] lg:hidden divide-x-2">
        <div className = "pl-1 w-1/2">
          <LeftSidebar />
        </div>
        <div className = "pl-1 w-1/2">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
