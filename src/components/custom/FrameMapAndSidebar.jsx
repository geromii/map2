// frame for map
import { useState } from "react";
import { IconArrowsDiagonalMinimize2, IconArrowsDiagonal, IconArrowsDiagonalMinimize, IconArrowsDiagonal2, IconArrowsMaximize, IconArrowsMinimize, IconX } from '@tabler/icons-react';


export default function MapFrame( {LeftSidebar, RightSidebar, MainMap} ) {
    const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
    const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  
    const sidebarFull = 15;
    const sidebarSmall = 5;
  
    const leftSidebarWidth = leftSidebarVisible ? sidebarFull : sidebarSmall;
    const rightSidebarWidth = rightSidebarVisible ? sidebarFull : sidebarSmall;
    const mapWidth = 100 - leftSidebarWidth - rightSidebarWidth;
    const marginRight = rightSidebarVisible ? -15 : 0;
    const marginLeft = leftSidebarVisible ? -15 : 0;
  
    const sidebarClasses = ` self-center  rounded-xl shadow-2xl border z-20 minh-[80%] lg:min-h-[55%] bg-card w-full`;
    return (
      <div className="pt-1 w-screen flex justify-between  mt-0.5 xl:mt-1 lg:my-1 pb-[100px] border-b-4 shadow min-h-[67vw] ">
  
        <div
          style={{ width: `${leftSidebarWidth}vw`, minWidth: `${leftSidebarWidth}vw`, maxWidth: `${leftSidebarWidth}vw`}}
          className="self-stretch transition-all duration-300 ease-in-out flex"
        >
          <div className={sidebarClasses + ` rounded-l-none border-l-0 `}>
            <div className="w-full max-w-[270px] flex justify-end p-1 pb-0">
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
          style={{
            marginRight: `${marginRight}px`,
            marginLeft: `${marginLeft}px`,
          }}
          className="map relative w-[88%] row-start-1 transition-all duration-300 ease-in-out h-full "
        >
          <MainMap />
          <div className="hidden md:block absolute bottom-0 left-0.5 z-30">
           {(leftSidebarVisible || rightSidebarVisible) && <button onClick={() => {setLeftSidebarVisible(false); setRightSidebarVisible(false);}}><IconArrowsMaximize color="white" size={28}/></button>}
        </div>

        </div>
        <div
          style={{ width: `${rightSidebarWidth}vw`, minWidth: `${rightSidebarWidth}vw`, maxWidth: `${rightSidebarWidth}vw`}}
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
      </div>
    );
  }